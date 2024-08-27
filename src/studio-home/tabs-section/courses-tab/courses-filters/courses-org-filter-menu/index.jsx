import PropTypes from 'prop-types';
import { useIntl } from '@edx/frontend-platform/i18n';

import CoursesFilterMenu from '../courses-filter-menu';
import messages from './messages';

const CoursesOrgFilterMenu = ({ coursesData, onItemMenuSelected }) => {
    const intl = useIntl();

    const handleCourseTypeSelected = (courseOrg) => {
      onItemMenuSelected(courseOrg);
    };
  
    return (
      <>
        <CoursesFilterMenu
          id="dropdown-toggle-courses-org-menu"
          menuItems={coursesData}
          onItemMenuSelected={handleCourseTypeSelected}
          defaultItemSelectedText={intl.formatMessage(messages.coursesOrgFilterMenuAllOrganization)}
        />
      </>
    );
};
  
CoursesOrgFilterMenu.propTypes = {
  onItemMenuSelected: PropTypes.func.isRequired,
};

export default CoursesOrgFilterMenu;