import React from 'react';
import ShortcodeArchitect from './ShortcodeArchitect';

const AdminApp = () => {
    // Since this component is only mounted when #rmss-admin-root is present
    // (which is only output on the Architect page), we can directly render the Architect.
    return <ShortcodeArchitect />;
};

export default AdminApp;
