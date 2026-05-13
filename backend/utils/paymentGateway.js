const OPEN_TO_HALF_OPEN_MS = 30_000;

const gatewayState = {
  mode: 'closed',
  updatedAt: Date.now(),
  probeAvailable: true,
};

function syncState() {
  if (gatewayState.mode === 'open' && Date.now() - gatewayState.updatedAt >= OPEN_TO_HALF_OPEN_MS) {
    gatewayState.mode = 'half-open';
    gatewayState.updatedAt = Date.now();
    gatewayState.probeAvailable = true;
  }
}

export function getGatewayStatus() {
  syncState();

  const canAttempt = gatewayState.mode !== 'open' && (gatewayState.mode !== 'half-open' || gatewayState.probeAvailable);

  return {
    mode: gatewayState.mode,
    canAttempt,
    probeAvailable: gatewayState.probeAvailable,
    updatedAt: new Date(gatewayState.updatedAt).toISOString(),
    retryAfterSeconds: gatewayState.mode === 'open' ? Math.ceil(OPEN_TO_HALF_OPEN_MS / 1000) : 0,
    message:
      gatewayState.mode === 'open'
        ? 'Hệ thống thanh toán đang bảo trì, vui lòng thử lại sau.'
        : gatewayState.mode === 'half-open'
          ? gatewayState.probeAvailable
            ? 'Cổng đang half-open, cho phép một lượt thanh toán thử nghiệm.'
            : 'Cổng half-open đã dùng hết lượt thử nghiệm, vui lòng chờ reset.'
          : 'Cổng thanh toán đang hoạt động bình thường.',
  };
}

export function setGatewayMode(nextMode) {
  const normalizedMode = String(nextMode || '').toLowerCase();

  if (!['closed', 'open', 'half-open'].includes(normalizedMode)) {
    throw new Error('Invalid gateway mode');
  }

  gatewayState.mode = normalizedMode;
  gatewayState.updatedAt = Date.now();
  gatewayState.probeAvailable = true;

  return getGatewayStatus();
}

export function reserveGatewayAttempt() {
  syncState();

  if (gatewayState.mode === 'open') {
    throw new Error('Hệ thống thanh toán đang bảo trì, vui lòng thử lại sau.');
  }

  if (gatewayState.mode === 'half-open' && !gatewayState.probeAvailable) {
    throw new Error('Cổng thanh toán đang half-open và đã hết lượt thử nghiệm.');
  }

  if (gatewayState.mode === 'half-open') {
    gatewayState.probeAvailable = false;
  }

  return getGatewayStatus();
}

export function completeGatewayAttemptSuccess() {
  gatewayState.mode = 'closed';
  gatewayState.updatedAt = Date.now();
  gatewayState.probeAvailable = true;

  return getGatewayStatus();
}

export function completeGatewayAttemptFailure() {
  gatewayState.mode = 'open';
  gatewayState.updatedAt = Date.now();
  gatewayState.probeAvailable = true;

  return getGatewayStatus();
}
