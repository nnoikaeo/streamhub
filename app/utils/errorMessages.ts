/**
 * Error Message Mapper
 * Converts technical errors to user-friendly messages (Thai)
 */

export interface ErrorInfo {
  title: string
  message: string
  showRequestAccess: boolean
}

export const mapErrorMessage = (error: any): ErrorInfo => {
  const errorMessage = error?.message || ''

  // User not found in system
  if (errorMessage.includes('not found in system')) {
    return {
      title: 'บัญชีไม่พบในระบบ',
      message:
        'บัญชีของคุณยังไม่ได้ตั้งค่าในระบบ โปรดติดต่อผู้ดูแลระบบเพื่อขอสิทธิการเข้าถึง',
      showRequestAccess: true
    }
  }

  // Firebase auth errors
  if (errorMessage.includes('cancelled')) {
    return {
      title: 'ยกเลิกการลงชื่อเข้า',
      message: 'คุณยกเลิกการลงชื่อเข้าใช้ โปรดลองอีกครั้ง',
      showRequestAccess: false
    }
  }

  if (errorMessage.includes('popup-closed-by-user')) {
    return {
      title: 'ยกเลิกการลงชื่อเข้า',
      message: 'หน้าต่างลงชื่อเข้าถูกปิดแล้ว โปรดลองอีกครั้ง',
      showRequestAccess: false
    }
  }

  if (errorMessage.includes('popup-blocked')) {
    return {
      title: 'การลงชื่อเข้าถูกบล็อก',
      message: 'เบราว์เซอร์ของคุณบล็อกหน้าต่างป๊อปอัป โปรดอนุญาตป๊อปอัปและลองอีกครั้ง',
      showRequestAccess: false
    }
  }

  if (errorMessage.includes('network')) {
    return {
      title: 'ข้อผิดพลาดของเครือข่าย',
      message: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ โปรดตรวจสอบการเชื่อมต่ออินเทอร์เน็ตและลองอีกครั้ง',
      showRequestAccess: false
    }
  }

  if (errorMessage.includes('permission')) {
    return {
      title: 'สิทธิ์การเข้าถึงถูกปฏิเสธ',
      message:
        'คุณไม่มีสิทธิ์ในการเข้าถึงระบบนี้ โปรดติดต่อผู้ดูแลระบบของคุณ',
      showRequestAccess: true
    }
  }

  // Default error
  return {
    title: 'การลงชื่อเข้าล้มเหลว',
    message: 'เกิดข้อผิดพลาดที่ไม่คาดคิด โปรดลองอีกครั้งหรือติดต่อฝ่ายสนับสนุน',
    showRequestAccess: true
  }
}

export const getDefaultErrorMessage = (): ErrorInfo => {
  return {
    title: 'ข้อผิดพลาด',
    message: 'เกิดข้อผิดพลาด โปรดลองอีกครั้ง',
    showRequestAccess: false
  }
}
