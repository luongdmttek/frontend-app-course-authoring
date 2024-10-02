import PropTypes from 'prop-types';
import { useIntl } from '@edx/frontend-platform/i18n';

import CoursesFilterMenu from '../courses-filter-menu';
import messages from './messages';

const CoursesRunFilterMenu = ({ filterRunData, onItemMenuSelected }) => {
    const intl = useIntl();

    const handleCourseTypeSelected = (courseRun) => {
      onItemMenuSelected(courseRun);
    };
  
    return (
      <>
        <CoursesFilterMenu
          id="dropdown-toggle-courses-run-menu"
          menuItems={filterRunData}
          onItemMenuSelected={handleCourseTypeSelected}
          defaultItemSelectedText={intl.formatMessage(messages.coursesRunFilterMenuAll)}
        />
      </>
    );
};
  
CoursesRunFilterMenu.propTypes = {
  filterRunData: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
    })
  ),
  onItemMenuSelected: PropTypes.func.isRequired,
};

export default CoursesRunFilterMenu;