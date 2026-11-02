class Database1 {
  constructor() {
    this.ss = SpreadsheetApp.getActiveSpreadsheet();
  }

  getSheet(sheetName) {
    return this.ss.getSheetByName(sheetName);
  }

  getAll(sheetName) {
    const sheet = this.getSheet(sheetName);
    if (!sheet) return [];

    const data = sheet.getDataRange().getValues();
    if (data.length === 0) return [];

    const headers = data[0];

    return data.slice(1).map(row => {
      let obj = {};
      headers.forEach((header, i) => obj[header] = row[i] || '');
      return obj;
    });
  }

getAllwithHeader(sheetName) {
  const sheet = this.getSheet(sheetName);
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  if (data.length === 0) return [];

  const headers = data[0]; // Ensure headers remain an array

  return {
    headers, // Store headers separately
    rows: data.slice(1).map(row => {
      let obj = {};
      headers.forEach((header, i) => obj[header] = row[i] || '');
      return obj;
    })
  };
}


  insert(sheetName, data) {
    const sheet = this.getSheet(sheetName);
    if (!sheet) return false;

    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const row = headers.map(header => data[header] || '');
    
    sheet.appendRow(row);
    return true;
  }

  update(sheetName, keyColumn, keyValue, updates) {
    const sheet = this.getSheet(sheetName);
    if (!sheet) return false;

    const data = sheet.getDataRange().getValues();
    if (data.length === 0) return false;

    const headers = data[0];
    const keyIndex = headers.indexOf(keyColumn);
    
    if (keyIndex === -1) return false;

    for (let i = 1; i < data.length; i++) {
      if (data[i][keyIndex] === keyValue) {
        const updatedRow = headers.map(header => updates[header] !== undefined ? updates[header] : data[i][headers.indexOf(header)]);
        sheet.getRange(i + 1, 1, 1, updatedRow.length).setValues([updatedRow]);
        return true;
      }
    }
    return false;
  }

  delete(sheetName, keyColumn, keyValue) {
    const sheet = this.getSheet(sheetName);
    if (!sheet) return false;

    const data = sheet.getDataRange().getValues();
    if (data.length === 0) return false;

    const headers = data[0];
    const keyIndex = headers.indexOf(keyColumn);
    
    if (keyIndex === -1) return false;

    for (let i = data.length - 1; i > 0; i--) {
      if (data[i][keyIndex] === keyValue) {
        sheet.deleteRow(i + 1);
        return true;
      }
    }
    return false;
  }

generateID(sheetName, idName, firstName, lastName) {
    const dataRows = this.getAll(sheetName) || []; // Ensure it's an array

    // Convert first and last name to lowercase and replace spaces with "_"
    const formatName = (name) => name.trim().replace(/\s+/g, '_');


    firstName = formatName(firstName);
    lastName = formatName(lastName);

    const baseID = `${firstName}_${lastName}_`;

    // Find the highest existing number
    let lastNumber = 0;
    for (const row of dataRows) {
        if (row[idName] && row[idName].startsWith(baseID)) {
            const numPart = parseInt(row[idName].split('_').pop(), 10);
            if (!isNaN(numPart) && numPart > lastNumber) {
                lastNumber = numPart;
            }
        }
    }

    // Generate the new ID with incremented number
    return `${baseID}${(lastNumber + 1).toString().padStart(4, '0')}`;
}


}


/**
 * Database Module
 * 
 * Handles all interactions with the Google Sheets database
 */

const Database = (function() {
  /**
   * Gets the active spreadsheet
   * @return {Spreadsheet} The active spreadsheet
   */
  function getSpreadsheet() {
    return SpreadsheetApp.getActiveSpreadsheet();
  }
  
  /**
   * Gets a sheet by name
   * @param {string} sheetName - Name of the sheet
   * @return {Sheet} The requested sheet
   */
  function getSheet(sheetName) {
    return getSpreadsheet().getSheetByName(sheetName);
  }
  
  /**
   * Gets all data from a sheet
   * @param {string} sheetName - Name of the sheet
   * @return {Array} 2D array of sheet data
   */
  function getSheetData(sheetName) {
    const sheet = getSheet(sheetName);
    if (!sheet) return [];
    
    const data = sheet.getDataRange().getValues();
    return data;
  }
  
  /**
   * Gets user by email
   * @param {string} email - User email
   * @return {Object|null} User object or null if not found
   */
  function getUserByEmail(email) {
    if (!email) return null;
    
    const data = getSheetData('Users');
    if (data.length <= 1) return null; // Only header row exists
    
    const headerRow = data[0];
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][headerRow.indexOf('Email')] === email) {
        return rowToUserObject(headerRow, data[i]);
      }
    }
    
    return null;
  }
  
  /**
   * Gets user by ID
   * @param {string} id - User ID
   * @return {Object|null} User object or null if not found
   */
  function getUserById(id) {
    if (!id) return null;
    
    const data = getSheetData('Users');
    if (data.length <= 1) return null; // Only header row exists
    
    const headerRow = data[0];
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][headerRow.indexOf('UserID')] == id) {
        return rowToUserObject(headerRow, data[i]);
      }
    }
    
    return null;
  }
  

  
  /**
   * Adds a new user
   * @param {Object} user - User object
   * @return {boolean} Success status
   */
  function addUser(user) {
    try {
      const sheet = getSheet('Users');
      const headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      
      // Create a row array in the same order as the header row
      const rowData = [];
      for (let i = 0; i < headerRow.length; i++) {
        const field = headerRow[i];
        rowData.push(user[field] || '');
      }
      
      sheet.appendRow(rowData);
      return true;
    } catch (error) {
      console.error('Add user error:', error);
      return false;
    }
  }
  
  /**
   * Updates user information
   * @param {string} id - User ID
   * @param {Object} updates - Object with fields to update
   * @return {boolean} Success status
   */
  function updateUser(id, updates) {
    try {
      const sheet = getSheet('Users');
      const data = sheet.getDataRange().getValues();
      const headerRow = data[0];
      
      for (let i = 1; i < data.length; i++) {
        if (data[i][headerRow.indexOf('UserID')] === id) {
          const row = i + 1; // Sheet rows are 1-indexed
          
          // Update each field
          for (const field in updates) {
            if (headerRow.includes(field)) {
              const col = headerRow.indexOf(field) + 1; // Sheet columns are 1-indexed
              sheet.getRange(row, col).setValue(updates[field]);
            }
          }
          
          return true;
        }
      }
      
      return false; // User not found
    } catch (error) {
      console.error('Update user error:', error);
      return false;
    }
  }
  
  /**
   * Updates user last login timestamp
   * @param {string} id - User ID
   * @return {boolean} Success status
   */
  function updateUserLastLogin(id) {
    return updateUser(id, { LastLogin: new Date().toISOString() });
  }
  
  /**
   * Updates user password
   * @param {string} id - User ID
   * @param {string} hashedPassword - Hashed password
   * @return {boolean} Success status
   */
  function updateUserPassword(id, hashedPassword) {
    return updateUser(id, { Password: hashedPassword });
  }
  
  /**
   * Updates user status (active/inactive)
   * @param {string} id - User ID
   * @param {string} status - New status
   * @return {boolean} Success status
   */
  function updateUserStatus(id, status) {
    return updateUser(id, { Status: status });
  }
  
  /**
   * Saves password reset token for user
   * @param {string} id - User ID
   * @param {string} token - Reset token
   * @param {Date} expiryTime - Token expiry time
   * @return {boolean} Success status
   */
  function savePasswordResetToken(id, token, expiryTime) {
    return updateUser(id, { 
      ResetToken: token, 
      ResetTokenExpiry: expiryTime.toISOString() 
    });
  }
  
  /**
   * Gets user by reset token
   * @param {string} token - Reset token
   * @return {Object|null} User object or null if not found or token expired
   */
  function getUserByResetToken(token) {
    if (!token) return null;
    
    const data = getSheetData('Users');
    if (data.length <= 1) return null; // Only header row exists
    
    const headerRow = data[0];
    const tokenCol = headerRow.indexOf('ResetToken');
    const expiryCol = headerRow.indexOf('ResetTokenExpiry');
    
    if (tokenCol === -1 || expiryCol === -1) return null;
    
    const now = new Date();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][tokenCol] === token) {
        // Check if token is expired
        const expiry = new Date(data[i][expiryCol]);
        if (expiry > now) {
          return rowToUserObject(headerRow, data[i]);
        }
      }
    }
    
    return null;
  }
  
  /**
   * Gets all roles
   * @return {Array} Array of role objects
   */
  function getAllRoles() {
    const data = getSheetData('Roles');
    if (data.length <= 1) return []; // Only header row exists
    
    const headerRow = data[0];
    const roles = [];
    
    for (let i = 1; i < data.length; i++) {
      roles.push({
        id: data[i][headerRow.indexOf('RoleID')],
        name: data[i][headerRow.indexOf('RoleName')],
        description: data[i][headerRow.indexOf('Description')]
      });
    }
    
    return roles;
  }
  
  /**
   * Gets role by name
   * @param {string} roleName - Role name
   * @return {Object|null} Role object or null if not found
   */
  function getRoleByName(roleName) {
    const data = getSheetData('Roles');
    if (data.length <= 1) return null; // Only header row exists
    
    const headerRow = data[0];
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][headerRow.indexOf('RoleName')] === roleName) {
        return {
          id: data[i][headerRow.indexOf('RoleID')],
          name: data[i][headerRow.indexOf('RoleName')],
          description: data[i][headerRow.indexOf('Description')]
        };
      }
    }
    
    return null;
  }
  
  /**
   * Gets users reporting to a specific manager
   * @param {string} managerId - Manager's user ID
   * @return {Array} Array of user objects
   */
  function getUsersByManager(managerId) {
    const data = getSheetData('Users');
    if (data.length <= 1) return []; // Only header row exists
    
    const headerRow = data[0];
    const users = [];
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][headerRow.indexOf('ReportsTo')] === managerId) {
        users.push(rowToUserObject(headerRow, data[i]));
      }
    }
    
    return users;
  }
  

  /**
   * Adds a new leave request
   * @param {Object} leaveRequest - Leave request object
   * @return {boolean} Success status
   */
  function addLeaveRequest(leaveRequest) {
    try {
      const sheet = getSheet('LeaveRequests');
      const headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      
      // Generate leave ID
      leaveRequest.LeaveID = generateID3('LeaveRequests','LeaveID',leaveRequest.EmployeeID);
      
      // Create a row array in the same order as the header row
      const rowData = [];
      for (let i = 0; i < headerRow.length; i++) {
        const field = headerRow[i];
        rowData.push(leaveRequest[field] || '');
      }
      
      sheet.appendRow(rowData);
      return true;
    } catch (error) {
      console.error('Add leave request error:', error);
      return false;
    }
  }
  
  /**
   * Gets leave requests for a user
   * @param {string} userId - User ID
   * @return {Array} Array of leave request objects
   */
  function getLeaveRequestsByUser(userId) {
    const data = getSheetData('LeaveRequests');
    if (data.length <= 1) return []; // Only header row exists
    
    const headerRow = data[0];
    const leaveRequests = [];
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][headerRow.indexOf('EmployeeID')] == userId) {
        leaveRequests.push(rowToLeaveObject(headerRow, data[i]));
      }
    }
    
    return leaveRequests;
  }
  
  /**
   * Gets leave requests to be approved by a manager
   * @param {string} managerId - Manager's user ID
   * @return {Array} Array of leave request objects
   */


  function getLeaveRequestsForApproval(managerId) {
    // Get all users reporting to this manager
    const reportingUsers = getUsersByManager(managerId);
    const reportingUserIds = reportingUsers.map(user => user.UserID);
    
    const data = getSheetData('LeaveRequests');
    if (data.length <= 1) return []; // Only header row exists
    
    const headerRow = data[0];
    const leaveRequests = [];
    
    for (let i = 1; i < data.length; i++) {
      const employeeId = data[i][headerRow.indexOf('EmployeeID')];
      const status = data[i][headerRow.indexOf('Status')];
      
      // If employee reports to this manager and leave request is pending
      if (reportingUserIds.includes(employeeId) && status === 'Pending') {
        leaveRequests.push(rowToLeaveObject(headerRow, data[i]));
      }
    }
    
    return leaveRequests;
  }
  
  /**
   * Updates leave request status
   * @param {string} leaveId - Leave request ID
   * @param {string} status - New status
   * @param {string} approverId - Approver's user ID
   * @param {string} approverName - Approver's name
   * @param {string} comments - Comments
   * @return {boolean} Success status
   */
  function updateLeaveRequestStatus(leaveId, status, approverId, approverName, comments) {
    try {
      const sheet = getSheet('LeaveRequests');
      const data = sheet.getDataRange().getValues();
      const headerRow = data[0];
      
      for (let i = 1; i < data.length; i++) {
        if (data[i][headerRow.indexOf('LeaveID')] === leaveId) {
          const row = i + 1; // Sheet rows are 1-indexed
          
          // Update status
          sheet.getRange(row, headerRow.indexOf('Status') + 1).setValue(status);
          
          // Update approver info
          sheet.getRange(row, headerRow.indexOf('ApproverID') + 1).setValue(approverId);
          sheet.getRange(row, headerRow.indexOf('ApproverName') + 1).setValue(approverName);
          
          // Update approval date
          const formattedDate = new Date().toISOString().split('T')[0]; 
          sheet.getRange(row, headerRow.indexOf('ApprovalDate') + 1).setValue(formattedDate);

          
          // Update comments
          sheet.getRange(row, headerRow.indexOf('Comments') + 1).setValue(comments);
          
          return true;
        }
      }
      
      return false; // Leave request not found
    } catch (error) {
      console.error('Update leave request error:', error);
      return false;
    }
  }
  
  /**
   * Gets all menus
   * @return {Array} Array of menu objects
   */
  function getAllMenus() {
    const data = getSheetData('Menus');
    if (data.length <= 1) return []; // Only header row exists
    
    const headerRow = data[0];
    const menus = [];
    
    for (let i = 1; i < data.length; i++) {
      menus.push({
        id: data[i][headerRow.indexOf('MenuID')],
        name: data[i][headerRow.indexOf('MenuName')],
        icon: data[i][headerRow.indexOf('Icon')],
        url: data[i][headerRow.indexOf('URL')],
        parentId: data[i][headerRow.indexOf('ParentID')],
        displayOrder: data[i][headerRow.indexOf('DisplayOrder')]
      });
    }
    
    return menus;
  }
  
  /**
   * Converts a row array to a user object
   * @param {Array} headerRow - Array of column names
   * @param {Array} dataRow - Array of user data
   * @return {Object} User object
   */
  function rowToUserObject(headerRow, dataRow) {
    const user = {};
    
    for (let i = 0; i < headerRow.length; i++) {
      user[headerRow[i]] = dataRow[i];
    }
    
    return user;
  }
  
  /**
   * Converts a row array to a leave request object
   * @param {Array} headerRow - Array of column names
   * @param {Array} dataRow - Array of leave request data
   * @return {Object} Leave request object
   */
  function rowToLeaveObject(headerRow, dataRow) {
    const leave = {};
    
    for (let i = 0; i < headerRow.length; i++) {
      leave[headerRow[i]] = dataRow[i];
    }
    
    return leave;
  }
  
  // Return public methods
  return {
    getUserByEmail: getUserByEmail,
    getUserById: getUserById,
    getAllUsers: getAllUsers,
    addUser: addUser,
    updateUser: updateUser,
    updateUserLastLogin: updateUserLastLogin,
    updateUserPassword: updateUserPassword,
    updateUserStatus: updateUserStatus,
    savePasswordResetToken: savePasswordResetToken,
    getUserByResetToken: getUserByResetToken,
    getAllRoles: getAllRoles,
    getRoleByName: getRoleByName,
    getUsersByManager: getUsersByManager,
    addLeaveRequest: addLeaveRequest,
    getLeaveRequestsByUser: getLeaveRequestsByUser,
    getLeaveRequestsForApproval: getLeaveRequestsForApproval,
    updateLeaveRequestStatus: updateLeaveRequestStatus,
    getAllMenus: getAllMenus,
    getSheetData:getSheetData
  };
})();
