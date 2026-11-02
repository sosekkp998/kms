/**
 * Permissions Module
 * 
 * Handles role-based access control and menu permissions
 */
function test21(){
 
  const t=Permissions.getUserMenus("super_admin");
  Logger.log(t);

}
const Permissions = (function() {
  /**
   * Gets permissions for a specific role
   * @param {string} roleName - Name of the role
   * @return {Object} Object mapping menu IDs to permission objects
   */
  function getRolePermissions(roleId) {
    try {
      // Get role ID
      // const role = Database.getRoleByName(roleName);
       
      // if (!role) {
      //   return {};
      // }
      
      //const roleId = role.id;
      
      // Get permissions data
      
      const data = Database.getSheetData('Permissions');
      
      if (data.length <= 1) return {}; // Only header row exists
      
      const headerRow = data[0];
      const roleIdCol = headerRow.indexOf('RoleID');
      const menuIdCol = headerRow.indexOf('MenuID');
      const canViewCol = headerRow.indexOf('CanView');
      const canAddCol = headerRow.indexOf('CanAdd');
      const canEditCol = headerRow.indexOf('CanEdit');
      const canDeleteCol = headerRow.indexOf('CanDelete');
      
      // Create permissions map
      const permissions = {};
      
      for (let i = 1; i < data.length; i++) {
        
        if (data[i][roleIdCol] == roleId) {
          const menuId = data[i][menuIdCol];
          permissions[menuId] = {
            canView: String(data[i][canViewCol]).toLowerCase() === 'true',
            canAdd: String(data[i][canAddCol]).toLowerCase() === 'true',
            canEdit: String(data[i][canEditCol]).toLowerCase() === 'true',
            canDelete: String(data[i][canDeleteCol]).toLowerCase() === 'true'
          };
        }
      }
      return permissions;
    } catch (error) {
      console.error('Get role permissions error:', error);
      return {};
    }
  }
  
  /**
   * Gets user permissions based on role
   * @param {string} roleName - Name of the role
   * @return {Object} Object containing permissions and valid flag
   */
  function getUserPermissions(roleName="Super Admin") {
    try {
      const rolePermissions = getRolePermissions(roleName);
      Logger.log(rolePermissions);
      if (Object.keys(rolePermissions).length === 0) {
        return { 
          valid: false, 
          message: 'Role permissions not found',
          permissions: {}
        };
      }
      
      return {
        valid: true,
        permissions: rolePermissions
      };
    } catch (error) {
      console.error('Get user permissions error:', error);
      return { 
        valid: false, 
        message: 'Error retrieving permissions',
        permissions: {}
      };
    }
  }
  
  /**
   * Gets menus accessible to a user based on role
   * @param {string} roleName - Name of the role
   * @return {Object} Object containing menus and valid flag
   */
  function getUserMenus(roleName) {
    try {
      const rolePermissions = getRolePermissions(roleName);
      Logger.log(rolePermissions);
      if (Object.keys(rolePermissions).length === 0) {
        return { 
          valid: false, 
          message: 'Role permissions not found',
          menus: []
        };
      }
      
      // Get all menus
      const allMenus = Database.getAllMenus();
      Logger.log(allMenus);
      // Filter menus based on view permission
      const accessibleMenus = allMenus.filter(menu => 
        rolePermissions[menu.id] && rolePermissions[menu.id].canView
      );
      
      // Sort by display order
      accessibleMenus.sort((a, b) => a.displayOrder - b.displayOrder);
      
      return {
        valid: true,
        menus: accessibleMenus
      };
    } catch (error) {
      console.error('Get user menus error:', error);
      return { 
        valid: false, 
        message: 'Error retrieving menus',
        menus: []
      };
    }
  }
  
  /**
   * Checks if a user has permission for a specific action on a menu
   * @param {string} roleName - Name of the role
   * @param {string} menuId - ID of the menu
   * @param {string} action - Action to check (view, add, edit, delete)
   * @return {boolean} Whether the user has permission
   */
  function hasPermission(roleName, menuId, action) {
    try {
      const rolePermissions = getRolePermissions(roleName);
      
      if (!rolePermissions[menuId]) {
        return false;
      }
      
      switch (action) {
        case 'view':
          return rolePermissions[menuId].canView;
        case 'add':
          return rolePermissions[menuId].canAdd;
        case 'edit':
          return rolePermissions[menuId].canEdit;
        case 'delete':
          return rolePermissions[menuId].canDelete;
        default:
          return false;
      }
    } catch (error) {
      console.error('Check permission error:', error);
      return false;
    }
  }
  
  // Return public methods
  return {
    getRolePermissions: getRolePermissions,
    getUserPermissions: getUserPermissions,
    getUserMenus: getUserMenus,
    hasPermission: hasPermission
  };
})();
