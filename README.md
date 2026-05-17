# UniHub Workshop

A comprehensive workshop management and attendance system with mobile, web, and backend components. This project enables administrators to manage workshops and students to check in using QR code scanning.

## Table of Contents

- [Project Overview](#project-overview)
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Quick Start Guide](#quick-start-guide)
- [Detailed Setup Instructions](#detailed-setup-instructions)
  - [Environment Setup](#environment-setup)
  - [Backend Setup](#backend-setup)
  - [Mobile App Setup](#mobile-app-setup)
  - [Web Application Setup](#web-application-setup)
  - [AI Summary Service Setup](#ai-summary-service-setup-optional)
- [Running the Application](#running-the-application)
- [Demo Accounts](#demo-accounts)
- [Common Issues & Troubleshooting](#common-issues--troubleshooting)

## Project Overview

UniHub Workshop is a full-stack application designed for managing workshops with features including:

- **Admin Dashboard**: Manage workshops, participants, and check-ins
- **Mobile App**: QR code-based attendance checking with offline support
- **Web Portal**: Student-facing portal for workshop registration and details
- **AI Summary**: Automated AI-powered workshop summaries
- **Payment Integration**: Secure payment processing for paid workshops

## Prerequisites

Before you begin, ensure you have the following installed on your machine:

### Required Software

- **Git** - Version control system
- **Node.js** (v16 or higher) - JavaScript runtime for backend and web
- **Flutter** (v3.0 or higher) - For mobile development
- **Android Studio** or **Android SDK** - For Android development
- **Python** (v3.8 or higher) - For AI summary service (Optional)

### Hardware Requirements (for mobile testing)

- **Android Device** with USB debugging enabled (encourage), OR
- **Android Emulator** configured in Android Studio

### Quick Verification

Run these commands in your terminal to verify installations:

```powershell
git --version
node --version
npm --version
flutter --version
python --version
adb devices
```

## Project Structure

```
uni-workshop/
├── backend/                 # Node.js Express server
│   ├── api/                # API route handlers
│   ├── routes/             # Route definitions
│   ├── services/           # Business logic services
│   ├── utils/              # Utility functions
│   ├── middlewares/        # Express middlewares
│   ├── app.js              # Main app file
│   └── package.json        # Backend dependencies
│
├── frontend/
│   ├── mobile/             # Flutter mobile app
│   │   └── uni_hub_mobile/ # Main Flutter project
│   │       ├── lib/        # Dart source code
│   │       └── pubspec.yaml # Flutter dependencies
│   │
│   └── website/            # React web application
│       ├── src/            # React source code
│       ├── public/         # Static files
│       └── package.json    # Web dependencies
│
├── docs/                   # Project documentation
│   ├── design.md          # Design documentation
│   ├── feat.md            # Feature specifications
│   ├── specs/             # Detailed API specifications
│   └── script.sql         # Database schema
│
├── ai-summary/            # AI summary service
│   ├── main.py            # Python service
│   └── requirements.txt    # Python dependencies
│
└── test/                  # Load testing scripts
```

## Quick Start Guide

For experienced developers who just need to get running quickly:

### 1. Clone and Setup Backend

```powershell
git clone <REPO_URL>
cd uni-workshop/backend

# Create .env file with your configuration
# (See Backend Setup section for details)

npm install
npm run dev
```

### 2. Setup and Run Mobile (in a new terminal)

```powershell
cd uni-workshop/frontend/mobile/uni_hub_mobile
flutter pub get
flutter devices
flutter run -d <DEVICE_ID> --dart-define=API_BASE_URL=http://192.168.1.5:3000
```

### 3. Setup and Run Web (in another new terminal)

```powershell
cd uni-workshop/frontend/website
npm install
npm run dev
```

### 4. Setup and Run AI Summary Service (Optional, in another new terminal)

```powershell
cd uni-workshop/ai-summary
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

## Detailed Setup Instructions

### Environment Setup

#### Step 1: Clone the Repository

```powershell
git clone <REPO_URL>
cd uni-workshop
```

#### Step 2: Create Environment Configuration

Create a `.env` file in the `backend/` directory:

```powershell
cd backend
# Create .env file (use your favorite editor)
```

Add the following content to `backend/.env`:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Supabase Configuration (Database & Auth)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Email Configuration (for notifications)
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_password

# Payment Gateway Configuration
PAYMENT_API_KEY=your_payment_api_key
PAYMENT_MERCHANT_ID=your_merchant_id

# Redis Configuration (for caching and queues)
REDIS_URL=redis://localhost:6379

# JWT Secret
JWT_SECRET=your_secure_random_secret
```

### Backend Setup

#### Step 1: Install Backend Dependencies

```powershell
cd backend
npm install
```

**Note**: On Windows, if you encounter issues with `npm` command, use `npm.cmd` instead.

#### Step 2: Start Backend Development Server

```powershell
npm run dev
```

The backend will start at:

```
http://localhost:3000
```

You should see output like:

```
Server running on port 3000
Connected to Supabase
Redis connected
```

#### Step 3: Verify Backend

Open a new browser window and visit:

```
http://localhost:3000/health
```

You should receive a success response.

### Mobile App Setup

#### Step 1: Install Flutter Dependencies

```powershell
cd frontend/mobile/uni_hub_mobile
flutter pub get
```

#### Step 2: Check Connected Devices

```powershell
flutter devices
```

You should see your device listed. For example:

```
2 connected devices:

SM G950F (mobile) • R58M557JHPJ • android-arm64 • Android 9 (API 28)
Chrome (web)      • chrome      • web-javascript • Chrome 91.0.4472.124
```

**If no device appears:**

- Connect Android device via USB cable
- Enable USB Debugging on the device (Settings > Developer Options > USB Debugging)
- Accept the "Allow USB Debugging" permission dialog on the device
- Run `flutter devices` again

#### Step 3: Configure API Connection

Choose one method to connect the app to your backend:

**Method A: Using USB Reverse (Recommended for USB connection)**

```powershell
adb reverse tcp:3000 tcp:3000
```

Then use: `http://127.0.0.1:3000`

**Method B: Using Wi-Fi (Recommended for wireless testing)**

Find your computer's IP address:

```powershell
Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '169.254*' -and $_.IPAddress -ne '127.0.0.1' } | Select-Object InterfaceAlias,IPAddress
```

For example: `192.168.1.5`

#### Step 4: Run the Mobile App

Replace `R58M557JHPJ` with your actual device ID from `flutter devices`:

```powershell
# Using USB Reverse Method
flutter run -d R58M557JHPJ --dart-define=API_BASE_URL=http://127.0.0.1:3000

# OR Using Wi-Fi Method
flutter run -d R58M557JHPJ --dart-define=API_BASE_URL=http://192.168.1.5:3000
```

The app will build and install on your device. You'll see:

```
Running Gradle task 'assembleDebug'...
Built build/app/outputs/apk/debug/app-debug.apk
Installing and launching the application...
```

### Web Application Setup

#### Step 1: Install Web Dependencies

```powershell
cd frontend/website
npm install
```

#### Step 2: Configure API Connection

The web app will automatically connect to the backend. Ensure the backend is running at `http://localhost:3000`.

#### Step 3: Start Development Server

```powershell
npm run dev
```

The web application will start and open in your browser:

```
Local: http://localhost:5173
```

#### Step 4: Build for Production (Optional)

```powershell
npm run build
```

### AI Summary Service Setup (Optional)

The AI summary service is a Python-based microservice that generates AI-powered summaries of workshop content. This is optional but recommended for full functionality.

#### Step 1: Setup Python Virtual Environment

```powershell
cd ai-summary

# Create Python virtual environment
python -m venv .venv

# Activate the virtual environment
.venv\Scripts\activate
```

You should see `(.venv)` prefix in your terminal after activation.

#### Step 2: Install Python Dependencies

```powershell
pip install -r requirements.txt
```

#### Step 3: Configure Environment

Create or verify the `.env` file in the `ai-summary/` directory with necessary API keys and configuration.

#### Step 4: Run the Service

```powershell
python main.py
```

The service will start and listen for requests from the backend. You should see output indicating the service is running.

## Running the Application

### Complete Workflow

Once everything is set up, here's how to run all components:

#### Terminal 1: Backend

```powershell
cd uni-workshop/backend
npm run dev
```

Wait for the message: `Server running on port 3000`

#### Terminal 2: Web Application

```powershell
cd uni-workshop/frontend/website
npm run dev
```

Wait for the message: `Local: http://localhost:5173`

#### Terminal 3: Mobile Application

```powershell
cd uni-workshop/frontend/mobile/uni_hub_mobile
flutter run -d <DEVICE_ID> --dart-define=API_BASE_URL=http://192.168.1.5:3000
```

#### Terminal 4: AI Summary Service (Optional)

The AI summary service processes workshop content and generates AI-powered summaries. To run it:

```powershell
cd uni-workshop/ai-summary

# Create Python virtual environment
python -m venv .venv

# Activate virtual environment
.venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Run the service
python main.py
```

The service will start and listen for requests from the backend.

### Testing the Mobile App

Once the app is running on your device:

1. **Login**: Use a staff account to authenticate
2. **Open Workshops**: Navigate to the workshops list
3. **Load Manifest**: Select a workshop and download the participant manifest
4. **Test QR Scanning**: Use the camera to scan a participant QR code
5. **Test Offline Mode**: Disable network and scan more codes
6. **Verify Sync**: Re-enable network to verify automatic synchronization

## Demo Accounts

Use these accounts to test different features and roles in the application:

| Role | Email | Password | Notes |
|------|-------|----------|-------|
| **Student** | 23120001@student.hcmus.edu.vn | 111111 | |
| **Organizer** | admin@gmail.com | 111111 | |
| **Employee** | staff@gmail.com | 111111 | |

### Account Roles

- **Student**: Can view workshops, register for workshops, check in using QR code (web/mobile)
- **Organizer**: Can create/manage workshops, manage participants, view analytics, access admin dashboard
- **Employee**: Can perform check-ins via mobile app, scan QR codes, manage attendance

### How to Create Demo Accounts

1. **Student Account**:
   - Sign up or contact admin with student ID and email
   - Account will be activated by staff
   - Set password and start using the app

2. **Organizer Account**:
   - Admin creates account with organizer role
   - Access admin dashboard at `http://localhost:5173`
   - Manage workshops and participants

3. **Employee Account**:
   - Admin creates account with employee role
   - Use mobile app for QR code scanning
   - Check in participants during workshops

## Common Issues & Troubleshooting

### PowerShell Issues

**Error**: `npm.ps1 cannot be loaded`

**Solution**: Use `npm.cmd` instead of `npm`

```powershell
npm.cmd install
npm.cmd run dev
```

### Flutter/Android Issues

**Error**: Device not showing in `flutter devices`

**Solutions**:
- Check USB cable connection
- Enable USB Debugging on device (Settings > Developer Options > USB Debugging)
- Accept permission dialog on device
- Try: `adb kill-server` and `adb start-server`
- Restart Android Studio

**Error**: `Flutter: No connected devices`

**Solution**: 
- Use an Android Emulator: Open Android Studio > AVD Manager > Create/Start virtual device
- Or run: `flutter emulators --launch <emulator_id>`

### Backend Issues

**Error**: `Port 3000 already in use`

**Solution**: 
- Kill process on port 3000
- Or change PORT in `.env` file and restart

**Error**: `SUPABASE_URL is not configured`

**Solution**: 
- Ensure `.env` file is in `backend/` directory
- Verify all required Supabase keys are set
- Restart backend with `npm run dev`

### Mobile App Issues

**Error**: App can't reach backend

**Solutions**:
- Verify backend is running on `http://localhost:3000`
- Check API_BASE_URL is correct
- Ensure computer and mobile device are on same Wi-Fi network (for Wi-Fi method)
- Test with: `adb shell ping 192.168.1.5`

**Error**: Camera permission denied

**Solution**: 
- Go to device Settings > Apps > UniHub > Permissions > Camera
- Enable camera permission

**Error**: QR code scanning not working

**Solution**:
- Ensure camera permission is granted
- Verify manifest is downloaded in the app
- Check lighting conditions
- Ensure QR code is not damaged

### Web Application Issues

**Error**: Blank page or connection refused

**Solutions**:
- Verify backend is running on `http://localhost:3000`
- Clear browser cache (Ctrl+Shift+Del)
- Check browser console for errors (F12)
- Ensure port 5173 is not blocked by firewall

## Useful Development Commands

### Backend

```powershell
# Development with hot reload
npm run dev

# Production build
npm run build

# Run tests
npm run test

# Check logs from Redis
npm run check-redis

# Flush Redis cache
npm run flush-redis
```

### Mobile

```powershell
# Check app analysis
flutter analyze

# Run unit tests
flutter test

# View live logs
flutter logs

# Clean build
flutter clean

# Rebuild
flutter run
```

**During development, in the Flutter terminal:**

```
r   - Hot reload (quick refresh)
R   - Hot restart (full restart)
q   - Quit
```

### Web

```powershell
# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## Next Steps

1. Review the [design documentation](docs/design.md) for architecture details
2. Check [feature specifications](docs/feat.md) for comprehensive feature list
3. Review [API specifications](docs/specs/) for endpoint documentation
4. For AI summary service, see [ai-summary documentation](docs/specs/ai-summary.md)

## Support

For issues or questions, refer to:
- Issue Tracker: Check GitHub Issues
- Documentation: See `docs/` folder
- Specifications: See `docs/specs/` folder

---

**Happy coding! 🚀**