/**
 * Employee Management System - Main App Script
 * 
 * This script serves as the main entry point for the web application
 * and handles all the web app routes and initial setup..
 */

// Global variables
const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();
const CACHE_EXPIRATION_TIME = 10800; // 3 hours in seconds



/**
 * Serves HTML content based on the requested page
 */
function doGet(e) {
  // Initialize spreadsheet if needed
  // setupSpreadsheet();
  
  // Default to index/login page if no parameter is provided
  let page = 'login';
  
  if (e && e.parameter && e.parameter.page) {
    page = e.parameter.page;
  }
  
  // Return the requested page
  switch (page) {
    case 'login':
      return HtmlService.createTemplateFromFile('login')
        .evaluate()
        .setTitle('KMS Sosek')
        .addMetaTag('viewport', 'width=device-width, initial-scale=1')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    case 'resetpassword':
        let template= HtmlService.createTemplateFromFile('resetpassword');
        template.token=e.parameter.token;
        template.email=e.parameter.email;
        return template
        .evaluate()
        .setTitle('EMS - Resetpassword')
        .addMetaTag('viewport', 'width=device-width, initial-scale=1')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    default:
      return HtmlService.createTemplateFromFile('login')
        .evaluate()
        .setTitle('KMS - Login')
        .addMetaTag('viewport', 'width=device-width, initial-scale=1')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
}

/**
 * Include HTML files for templating
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Gets the script URL for navigation
 * @return {string} App URL
 */
function getScriptUrl() {
  return ScriptApp.getService().getUrl().replace("/dev", "/exec");
}

/**
 * Get CSS content
 */
function getStylesheet() {
  return HtmlService.createHtmlOutputFromFile('css/styles.css').getContent();
}

/**
 * Validate user session
 */
function validateSession(sessionToken) {
  return Authentication.validateSession(sessionToken);
}

/**
 * Get user permissions for menu rendering
 */
function getUserPermissions(sessionToken) {
  const userSession = Authentication.validateSession(sessionToken);
  if (!userSession) {
    return { valid: false, message: 'Invalid session' };
  }
  
  return Permissions.getUserPermissions(userSession.userRole);
}

/**
 * Get user menus based on permissions
 */
function getUserMenus(sessionToken) {
  const userSession = Authentication.validateSession(sessionToken);
  if (!userSession) {
    return { valid: false, message: 'Invalid session' };
  }
  
  return Permissions.getUserMenus(userSession.userRole);
}

/**
 * Get current user information
 */
function getCurrentUser(sessionToken) {
  const userSession = Authentication.validateSession(sessionToken);
  if (!userSession) {
    return { valid: false, message: 'Invalid session' };
  }
  
  return JSON.stringify({ 
    valid: true, 
    user: Database.getUserById(userSession.userId) 
  });
}



function logout(sessionToken){
  return Authentication.logout(sessionToken);
} 
function login(email, password) {
  return Authentication.login(email, password);
}

function getPendingApprovals(sessionToken){
  return LeaveManagement.getMyLeaveRequests(sessionToken);
}
 function changePassword(userId, currentPassword, newPassword) {
  return Authentication.changePassword(userId, currentPassword, newPassword);
 }


function getAllUsers(sessionToken){
  if(!validateSession(sessionToken)){
    throw new Error('Unauthorized access');
  }
  const db = new Database1();
  const users = db.getAll("Users");
 // Logger.log(users);
 
 return JSON.stringify(users);

}

function getRoles(){
  const db = new Database1();
  const roles = db.getAll("Roles");
  return roles;
}

function getDepartments(){
  const db = new Database1();
  const department = db.getAll("Department");
  return department;
}


function getUserById(userID="Super_Admin_0001") {

  const db = new Database1();
  const data = db.getAll('Users');
  const user = data.find(s => s.UserID == userID);

  //Logger.log(student); // Debugging

  return JSON.stringify(user || {}); // Return JSON, ensuring a valid object
}


function updateUser(sessionToken,userId, updateData){
  if(!validateSession(sessionToken)){
    throw new Error('Unauthorized access');
  }
    const updateUser = {
      Email: updateData.Email,
      FirstName: updateData.FirstName,
      LastName: updateData.LastName,
      Role: updateData.Role,
      ReportsTo: updateData.ReportsTo || '',
      Department: updateData.Department || '',
      Status: updateData.Status,
      Phone: updateData.Phone || '',
      Address: updateData.Address || '',
      JoinDate: updateData.JoinDate || '',
      VisaExpiry: updateData.VisaExpiry || '',
      InsuranceExpiry: updateData.InsuranceExpiry || ''

    };

  const db = new Database1();
  const stst= db.update('Users', 'UserID', userId, updateUser);
  if(stst){
      return {
      success: true,
      message: 'User Updated successfully'
    };
  }else{
    return {
      success: true,
      message: 'Update Failed'
    };
  }


}
  
  /**
   * Creates a new user (admin function)
   * @param {Object} userData - User data including email, password, name, role
   * @return {Object} Result of user creation
   */

function createUser(sessionToken,userData) {
  
    if(!validateSession(sessionToken)){
    throw new Error('Unauthorized access');
  }
  try {
    const db = new Database1();
    const { headers, rows } = db.getAllwithHeader('Users'); // Destructure headers & rows

    if (!Array.isArray(headers) || headers.length === 0) {
      throw new Error("User data sheet is empty or headers are missing.");
    }

    const emailIndex = headers.indexOf('Email'); // Find email column
    if (emailIndex === -1) {
      throw new Error("Email column not found in sheet headers.");
    }

    // Check if email already exists
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].Email === userData.email) {
        return { success: false, message: 'Email already in use' };
      }
    }
    const token=generateRandomToken();
    // Create user object
    const newUser = {
      UserID: db.generateID('Users', 'UserID', userData.FirstName,userData.LastName),
      Email: userData.Email,
      FirstName: userData.FirstName,
      LastName: userData.LastName,
      Role: userData.Role,
      ReportsTo: userData.ReportsTo || '',
      Department: userData.Department || '',
      Status: userData.Status,
      Phone: userData.Phone || '',
      Address: userData.Address || '',
      JoinDate: userData.JoinDate || '',
      VisaExpiry: userData.VisaExpiry || '',
      InsuranceExpiry: userData.InsuranceExpiry || '',
      Token:token
    };

    // Add user to database
    db.insert('Users', newUser);
    
    const deurl=getScriptUrl();
    const resetUrl = deurl+"?page=resetpassword&email="+userData.Email+"&token=" + token;

    // Send reset email
    MailApp.sendEmail({
      to: userData.Email,
      subject: "Password Creation Request",
      body: "Click the link below to create your password:\n\n" + resetUrl
    });

    return {
      success: true,
      message: 'User created successfully',
      user: {
        id: newUser.UserID,
        email: newUser.Email,
        firstName: newUser.FirstName,
        lastName: newUser.LastName,
        role: newUser.Role
      }
    };
  } catch (error) {
    console.error('User creation error:', error);
    return { success: false, message: 'An error occurred while creating the user' };
  }
}

function getEmployeeCount (sessionToken){
      return { 
        success: true, 
        count: 2
      };
}

function getAllRoles(sessionToken){
  return Database.getAllRoles();
}


function getDashboardData() {
  const db = new Database1();
  const users = db.getAll("Users");
  const leaveRequests = db.getAll("LeaveRequests");

  return JSON.stringify({ users: users, leaveRequests: leaveRequests });
}

  function getMyLeaveRequests(sessionToken) {
    try {
      // Validate session
      const session = Authentication.validateSession(sessionToken);
      if (!session) {
        return JSON.stringify({ success: false, message: 'Invalid session' });
      }
      
      // Get leave requests
      const leaveRequests = Database.getLeaveRequestsByUser(session.userId);
      return JSON.stringify({ 
        success: true, 
        leaveRequests: leaveRequests
      });
    } catch (error) {
      console.error('Get leave requests error:', error);
      return JSON.stringify({ success: false, message: 'An error occurred while retrieving leave requests' });
    }
  }

  function createLeaveRequest(sessionToken, leaveData) {
    let  leaveRequest={};
    try {
      // Validate session
      const session = Authentication.validateSession(sessionToken);
      if (!session) {
        return { success: false, message: 'Invalid session' };
      }
      
      // Get user details
      const user = Database.getUserById(session.userId);
      if (!user) {
        return { success: false, message: 'User not found' };
      }

      // Calculate total days
      const startDate = new Date(leaveData.startDate);
      const endDate = new Date(leaveData.endDate);
      const totalDays = calculateWorkingDays(startDate, endDate);
      
      if (totalDays <= 0) {
        return { success: false, message: totalDays };
      }
      const formattedDate = new Date().toISOString().split('T')[0]; 


      // Create leave request object
      leaveRequest = {
        LeaveID: '', // Will be generated by Database
        EmployeeID: user.UserID,
        EmployeeName: `${user.FirstName} ${user.LastName}`,
        LeaveType: leaveData.leaveType,
        StartDate: leaveData.startDate,
        EndDate: leaveData.endDate,
        TotalDays: totalDays,
        Reason: leaveData.reason,
        Status: 'Pending',
        ApproverID: '',
        ApproverName: '',
        RequestDate: formattedDate,
        ApprovalDate: '',
        Comments: ''
      };
      
      // Add leave request to database
      const result = Database.addLeaveRequest(leaveRequest);
      
      if (!result) {
        return { success: false, message: 'Failed to create leave request' };
      }
      
      return { 
        success: true, 
        message: 'Leave request created successfully',
        leaveRequest: leaveRequest
      };
    } catch (error) {
      console.error('Create leave request error:', error);
      return { success: false, message: 'An error occurred while creating leave request', ddd:leaveRequest };
    }
  }
  
    function calculateWorkingDays(startDate, endDate) {
    let count = 0;
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      // Skip weekends (0 = Sunday, 6 = Saturday)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++;
      }
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return count;
  }
 

    function getPendingApprovals1(sessionToken) {
    try {
      // Validate session
      const session = Authentication.validateSession(sessionToken);
      if (!session) {
        return JSON.stringify ({ success: false, message: 'Invalid session' });
      }
      
      // Get leave requests pending approval
      const pendingRequests = Database.getLeaveRequestsForApproval(session.userId);
      
      return JSON.stringify ({ 
        success: true, 
        leaveRequests: pendingRequests
      });
    } catch (error) {
      console.error('Get pending approvals error:', error);
      return JSON.stringify ({ success: false, message: 'An error occurred while retrieving pending approvals' });
    }
  }

  /**
   * Approves or rejects a leave request
   * @param {string} sessionToken - User's session token
   * @param {string} leaveId - ID of the leave request
   * @param {string} action - 'approve' or 'reject'
   * @param {string} comments - Comments on the decision
   * @return {Object} Result of the approval/rejection
   */
  function processLeaveRequest(sessionToken, leaveId, action, comments) {
    try {
      // Validate session
      const session = Authentication.validateSession(sessionToken);
      if (!session) {
        return { success: false, message: 'Invalid session' };
      }
      
      // Get user details
      const user = Database.getUserById(session.userId);
      if (!user) {
        return { success: false, message: 'User not found' };
      }
      
      // Set status based on action
      const status = action === 'approve' ? 'Approved' : 'Rejected';
      
      // Update leave request status
      const result = Database.updateLeaveRequestStatus(
        leaveId,
        status,
        user.UserID,
        `${user.FirstName} ${user.LastName}`,
        comments
      );
      
      if (!result) {
        return { success: false, message: 'Failed to process leave request' };
      }
      
      return { 
        success: true, 
        message: `Leave request ${status.toLowerCase()} successfully`
      };
    } catch (error) {
      console.error('Process leave request error:', error);
      return { success: false, message: 'An error occurred while processing leave request' };
    }
  }
  


  function generateResetToken(email) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
  if (!sheet) return { success: false, message: "Users sheet not found." };

  const data = sheet.getDataRange().getValues();
  const headers = data[0]; // Get header row
  const emailIndex = headers.indexOf("Email");
  const resetLinkIndex = headers.indexOf("Token");

  if (emailIndex === -1 || resetLinkIndex === -1) {
    return { success: false, message: "Required columns not found." };
  }

  // Find user row
  let userRow = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][emailIndex] === email) {
      userRow = i + 1; // Spreadsheet rows are 1-based
      break;
    }
  }

  if (userRow === -1) return { success: false, message: "Email not found." };

  // Generate random token
  const token = generateRandomToken();
  const deurl=getScriptUrl();
  const resetUrl = deurl+"?page=resetpassword&email="+email+"&token=" + token;

  // Save token in the sheet
  sheet.getRange(userRow, resetLinkIndex + 1).setValue(token);

  // Send reset email
  MailApp.sendEmail({
    to: email,
    subject: "Password Reset Request",
    body: "Click the link below to reset your password:\n\n" + resetUrl
  });

  return { success: true };
}

// Helper function to generate random token
function generateRandomToken() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}


function resetUserPassword(email, newPassword, token) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
  if (!sheet) return { success: false, message: "Users sheet not found." };

  const data = sheet.getDataRange().getValues();
  const headers = data[0]; // Get header row
  const emailIndex = headers.indexOf("Email");
  const tokenIndex = headers.indexOf("Token");
  const passwordIndex = headers.indexOf("Password");

  if (emailIndex === -1 || tokenIndex === -1 || passwordIndex === -1) {
    return { success: false, message: "Required columns not found." };
  }

  // Find user row
  let userRow = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][emailIndex] === email && data[i][tokenIndex] === token) {
      userRow = i + 1; // Spreadsheet rows are 1-based
      break;
    }
  }

  if (userRow === -1) return { success: false, message: "Invalid email or token." };

  // Hash password (Google Apps Script does not support bcrypt, use Base64 for basic security)
  const hashedPassword = hashPassword(newPassword);

  // Update password and clear the token
  sheet.getRange(userRow, passwordIndex + 1).setValue(hashedPassword);
  sheet.getRange(userRow, tokenIndex + 1).setValue(""); // Clear token

  return { success: true };
}


function getRoles() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Roles");
  const data = sheet.getDataRange().getValues();
  let roles = [];

  for (let i = 1; i < data.length; i++) {
    roles.push({
      RoleID: data[i][0],
      RoleName: data[i][1],
      Description: data[i][2]
    });
  }
  return roles;
}

function getPermissionsByRole(roleID) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const permissionsSheet = ss.getSheetByName("Permissions");
  const menusSheet = ss.getSheetByName("Menus");

  const permissionsData = permissionsSheet.getDataRange().getValues();
  const menusData = menusSheet.getDataRange().getValues();

  let permissionsMap = {};
  const lowerRoleID = roleID.toLowerCase();

  // Map existing permissions for the role
  for (let i = 1; i < permissionsData.length; i++) {
    if (permissionsData[i][0].toLowerCase() === lowerRoleID) {
      permissionsMap[permissionsData[i][1]] = {
        RoleID: permissionsData[i][0],
        MenuID: permissionsData[i][1],
        CanView: String(permissionsData[i][2]).toLowerCase() === 'true',
        CanAdd: String(permissionsData[i][3]).toLowerCase() === 'true',
        CanEdit: String(permissionsData[i][4]).toLowerCase() === 'true',
        CanDelete: String(permissionsData[i][5]).toLowerCase() === 'true'
      };
    }
  }

  let permissions = [];

  // Ensure all menus are included in the result, even if no permissions exist
  for (let i = 1; i < menusData.length; i++) {
    let menuID = menusData[i][0];

    if (permissionsMap[menuID]) {
      permissions.push(permissionsMap[menuID]); // Use existing permissions
    } else {
      permissions.push({
        RoleID: roleID,
        MenuID: menuID,
        CanView: false,
        CanAdd: false,
        CanEdit: false,
        CanDelete: false
      });
    }
  }

  return permissions;
}



function updatePermissions(permissions) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Permissions");
  const data = sheet.getDataRange().getValues();
  
  let lastRow = data.length; // Last row in the sheet

  for (let i = 0; i < permissions.length; i++) {
     let permission_RoleID = permissions[i].RoleID.toLowerCase();
     let permission_MenuID=permissions[i].MenuID.toLowerCase();
    let rowIndex = data.findIndex(row => row[0] === permission_RoleID && row[1] === permission_MenuID);

    if (rowIndex !== -1) {
      // Update existing permission
      sheet.getRange(rowIndex + 1, 3, 1, 4).setValues([[  // (rowIndex + 1) because array index starts at 0
        permissions[i].CanView ? "TRUE" : "FALSE",
        permissions[i].CanAdd ? "TRUE" : "FALSE",
        permissions[i].CanEdit ? "TRUE" : "FALSE",
        permissions[i].CanDelete ? "TRUE" : "FALSE"
      ]]);
    } else {
      // Insert new permission
      sheet.appendRow([
        permission_RoleID,
        permission_MenuID,
        permissions[i].CanView ? "TRUE" : "FALSE",
        permissions[i].CanAdd ? "TRUE" : "FALSE",
        permissions[i].CanEdit ? "TRUE" : "FALSE",
        permissions[i].CanDelete ? "TRUE" : "FALSE"
      ]);
    }
  }

  return { success: true };
}


function updateProfile(email,userdata){

     const updUser = {
      Phone: userdata.phone || '',
      Address: userdata.address || ''
    };

    // Add user to database
    const db = new Database1();
    db.update('Users', 'Email',email,updUser);
  return { success: true, message: "Updated Successfully." };
}


function saveProfileImageToDrive(base64Data, fileName, email) {
  try {
    const folderName = "UserProfileImages";
    const folder = getOrCreateFolder(folderName);
    const cleanFileName = email + "-profile.jpg";

    // 🔥 Delete previous image for this user if it exists
    const existingFiles = folder.getFilesByName(cleanFileName);
    while (existingFiles.hasNext()) {
      existingFiles.next().setTrashed(true); // Move to trash
    }

    // 📦 Decode and save new image
    const blob = Utilities.base64Decode(base64Data);
    const driveFile = folder.createFile(Utilities.newBlob(blob, MimeType.JPEG, cleanFileName));

    // 🌍 Make it public
    driveFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    // 🖼️ Thumbnail view link
    const imageUrl = "https://drive.google.com/thumbnail?id=" + driveFile.getId();

    // 📝 Update Sheet
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
    const emailColIndex = getColumnIndexByName(sheet, "Email");
    const profileImageColIndex = getColumnIndexByName(sheet, "ProfileImage");
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][emailColIndex - 1] === email) {
        sheet.getRange(i + 1, profileImageColIndex).setValue(imageUrl);
        break;
      }
    }

    return { success: true, imageUrl };
  } catch (e) {
    return { success: false, message: e.message };
  }
}




function getOrCreateFolder(name) {
  const folders = DriveApp.getFoldersByName(name);
  return folders.hasNext() ? folders.next() : DriveApp.createFolder(name);
}

function getColumnIndexByName(sheet, columnName) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  return headers.indexOf(columnName) + 1;
}


//Tambahan

function registerNewUser(userData) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
    if (!sheet) {
      return { success: false, message: "Sheet 'Users' tidak ditemukan" };
    }

    // Cek apakah email sudah terdaftar
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const emailCol = headers.indexOf("Email");

    if (emailCol === -1) {
      return { success: false, message: "Kolom 'Email' tidak ditemukan" };
    }

    for (let i = 1; i < data.length; i++) {
      if (data[i][emailCol] === userData.Email) {
        return { success: false, message: "Email sudah terdaftar" };
      }
    }

    // Buat UserID otomatis (contoh format yang sudah dipakai di sheet kamu)
    const now = new Date();
    const userId = "USER_" + Utilities.formatDate(now, "GMT+7", "yyyyMMddHHmmss");

    // Hash password sebelum disimpan
    const hashedPassword = hashPassword(userData.Password);

    // Baris baru untuk ditambahkan
    const newRow = [
      userId,                      // UserID
      userData.Email,              // Email
      hashedPassword,              // Password (sudah di-hash)
      userData.FirstName || "",    // FirstName
      userData.LastName || "",     // LastName
      userData.Role = "Employee",
      userData.ReportsTo,
      userData.Department,
      userData.JoinDate,
      userData.Status ="Active",
      userData.Phone || "",        // Phone
      userData.Address || "",      // Address
      ""                           // ProfileImage (kosong dulu)
    ];










    // Tambahkan baris baru
    sheet.appendRow(newRow);

    return { 
      success: true, 
      message: "Pendaftaran berhasil! Silakan login dengan email dan password yang baru dibuat." 
    };

  } catch (e) {
    console.error("Error saat register:", e);
    return { success: false, message: "Terjadi kesalahan server: " + e.message };
  }
}





//tambahan buka html tes
//untuk memuat file xxxxx.html dengan menambah case dan membuat function di jsmain.html, codegs, dan xxxxx.html

function getTesHtmlContent() {
  try {
    // Ambil isi file tes.html
    const htmlTemplate = HtmlService.createTemplateFromFile('tes');
    
    // Jika tes.html punya scriptlet (<?= ... ?>), evaluasi dulu
    const evaluatedHtml = htmlTemplate.evaluate()
      .setTitle('Realisasi Detail')           // judul halaman (opsional)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    
    // Kembalikan sebagai string HTML
    return evaluatedHtml.getContent();
    
  } catch (e) {
    console.error('Error mengambil tes.html:', e);
    return `
      <div class="alert alert-danger">
        Gagal memuat halaman: ${e.message || 'File tes.html tidak ditemukan atau error'}
      </div>
    `;
  }
}

function getMenu4HtmlContent() {
  try {
    // Ambil isi file menu4.html
    const htmlTemplate = HtmlService.createTemplateFromFile('menu4');
    
    // Jika menu4.html punya scriptlet (<?= ... ?>), evaluasi dulu
    const evaluatedHtml = htmlTemplate.evaluate()
      .setTitle('Realisasi Detail')           // judul halaman (opsional)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    
    // Kembalikan sebagai string HTML
    return evaluatedHtml.getContent();
    
  } catch (e) {
    console.error('Error mengambil menu4.html:', e);
    return `
      <div class="alert alert-danger">
        Gagal memuat halaman: ${e.message || 'File menu4.html tidak ditemukan atau error'}
      </div>
    `;
  }
}

function getDk2026HtmlContent() {
  try {
    // Ambil isi file dk2026.html
    const htmlTemplate = HtmlService.createTemplateFromFile('dk2026');
    
    const evaluatedHtml = htmlTemplate.evaluate()
      .setTitle('Dashboard Realisasi 2026')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    
    return evaluatedHtml.getContent();
    
  } catch (e) {
    console.error('Error mengambil dk2026.html:', e);
    return `
      <div class="alert alert-danger">
        Gagal memuat halaman: ${e.message || 'File dk2026.html tidak ditemukan'}
      </div>
    `;
  }
}

function getRpd2026HtmlContent() {
  try {
    // Ambil isi file rpd2026.html
    const htmlTemplate = HtmlService.createTemplateFromFile('rpd2026');
    
    const evaluatedHtml = htmlTemplate.evaluate()
      .setTitle('Dashboard RPD 2026')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    
    return evaluatedHtml.getContent();
    
  } catch (e) {
    console.error('Error mengambil rpd2026.html:', e);
    return `
      <div class="alert alert-danger">
        Gagal memuat halaman: ${e.message || 'File rpd2026.html tidak ditemukan'}
      </div>
    `;
  }
}


function getBukuHtmlContent() {
  try {
    // Ambil isi file buku.html
    const htmlTemplate = HtmlService.createTemplateFromFile('buku');
    
    const evaluatedHtml = htmlTemplate.evaluate()
      .setTitle('Buku')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    
    return evaluatedHtml.getContent();
    
  } catch (e) {
    console.error('Error mengambil buku.html:', e);
    return `
      <div class="alert alert-danger">
        Gagal memuat halaman: ${e.message || 'File buku.html tidak ditemukan'}
      </div>
    `;
  }
}


