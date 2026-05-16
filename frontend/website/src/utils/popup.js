import Swal from 'sweetalert2';

export const showTicketSuccessAlert = (navigate) => {
    Swal.fire({
        title: 'Đăng ký thành công!',
        text: 'Thông tin xác nhận đã được hệ thống gửi vào email của bạn.',
        icon: 'success',
        confirmButtonText: 'Xem vé của tôi',
        confirmButtonColor: '#003366', 
        allowOutsideClick: false
    }).then((result) => {
        if (result.isConfirmed) {
            navigate('/tickets');
        }
    });
};