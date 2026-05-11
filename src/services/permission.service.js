export function getPermissions(role) {
  const permissions = {
    trip_request: false,
    trip_my: false,
    trip_approval: false,
  };

  switch (role) {
    case "STAFF":
      permissions.trip_request = true;
      permissions.trip_my = true;
      break;

    case "MANAGER":
      permissions.trip_request = true;
      permissions.trip_my = true;
      permissions.trip_approval = true;
      break;

    case "HR":
      permissions.trip_request = true;
      permissions.trip_my = true;
      permissions.trip_approval = true;
      break;


    case "PIMPINAN":
      permissions.trip_approval = true;
      break;
  }

  return permissions;
}
