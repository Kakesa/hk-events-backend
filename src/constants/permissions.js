const MODULES = [
  'events',
  'guests',
  'invitations',
  'guestbook',
  'analytics',
  'users',
  'settings',
];

const fullAccess = () =>
  MODULES.map((module) => ({
    module,
    create: true,
    read: true,
    update: true,
    delete: true,
  }));

const readOnlyAccess = () =>
  MODULES.map((module) => ({
    module,
    create: false,
    read: true,
    update: false,
    delete: false,
  }));

const organizerAccess = () =>
  MODULES.map((module) => {
    const organizerModules = ['events', 'guests', 'invitations', 'guestbook', 'analytics'];
    const allowed = organizerModules.includes(module);

    return {
      module,
      create: allowed,
      read: allowed,
      update: allowed,
      delete: allowed,
    };
  });

const PERMISSIONS_BY_ROLE = {
  admin: fullAccess(),
  organizer: organizerAccess(),
  user: readOnlyAccess(),
};

const getPermissionsForRole = (role) => PERMISSIONS_BY_ROLE[role] || readOnlyAccess();

module.exports = {
  MODULES,
  getPermissionsForRole,
};
