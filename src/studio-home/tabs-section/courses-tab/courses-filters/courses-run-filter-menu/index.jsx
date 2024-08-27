import PropTypes from 'prop-types';
import { useIntl } from '@edx/frontend-platform/i18n';

import CoursesFilterMenu from '../courses-filter-menu';
import messages from './messages';

const CoursesRunFilterMenu = ({ coursesData, onItemMenuSelected }) => {
    const intl = useIntl();

    const handleCourseTypeSelected = (courseRun) => {
      onItemMenuSelected(courseRun);
    };
  
    return (
      <>
        <CoursesFilterMenu
          id="dropdown-toggle-courses-run-menu"
          menuItems={coursesData}
          onItemMenuSelected={handleCourseTypeSelected}
          defaultItemSelectedText={intl.formatMessage(messages.coursesRunFilterMenuAll)}
        />
      </>
    );
};
  
CoursesRunFilterMenu.propTypes = {
  onItemMenuSelected: PropTypes.func.isRequired,
};

export default CoursesRunFilterMenu;