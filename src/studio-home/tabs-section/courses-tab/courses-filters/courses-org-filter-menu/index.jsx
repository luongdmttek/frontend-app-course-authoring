import PropTypes from 'prop-types';
import { useEffect } from 'react';
import { useIntl } from '@edx/frontend-platform/i18n';

import CoursesFilterMenu from '../courses-filter-menu';
import messages from './messages';

const CoursesOrgFilterMenu = ({ filterOrgData, onItemMenuSelected, runListClick }) => {
  const intl = useIntl();

  const handleCourseTypeSelected = (courseOrg) => {
    onItemMenuSelected(courseOrg);
  };

  
  useEffect(() => {
    // reset organization filter value to 'allOrganization' when click 'All course run' value on Courses run filter
    if (!runListClick) {
      handleCourseTypeSelected('allOrganization');
    }
  }, [ runListClick ]);

  return (
    <>
      <CoursesFilterMenu
        id="dropdown-toggle-courses-org-menu"
        menuItems={filterOrgData}
        onItemMenuSelected={handleCourseTypeSelected}
        defaultItemSelectedText={intl.formatMessage(messages.coursesOrgFilterMenuAllOrganization)}
        runListClick={runListClick}
      />
    </>
  );
};
  
CoursesOrgFilterMenu.propTypes = {
  filterOrgData: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
    })
  ),
  onItemMenuSelected: PropTypes.func.isRequired,
  runListClick: PropTypes.bool,
};

export default CoursesOrgFilterMenu;