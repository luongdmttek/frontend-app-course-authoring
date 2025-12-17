import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { Icon, Dropdown, Form } from '@openedx/paragon';
import { Check } from '@openedx/paragon/icons';
import { getStudioHomeCoursesParams } from '../../../../data/selectors';
import { updateStudioHomeCoursesCustomParams } from '../../../../data/slice';
import { useIntl } from '@edx/frontend-platform/i18n';
import messages from './messages';
import './index.scss';

const CoursesFilterMenu = ({
  id: idProp,
  menuItems,
  onItemMenuSelected,
  defaultItemSelectedText,
  runListClick,
  useCustomMenu,
  filter
}) => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const [firstFilter, setfirstFilter] = useState(['allCourses', 'activeCourses', 'azCourses', 'allOrganization', 'allCourseRun']);
  const [itemMenuSelected, setItemMenuSelected] = useState(defaultItemSelectedText);
  const { cleanFilters } = useSelector(getStudioHomeCoursesParams);
  const handleCourseTypeSelected = (name, value) => {
    setItemMenuSelected(name);
    onItemMenuSelected(value);
    dispatch(updateStudioHomeCoursesCustomParams({
      showCleanFilterButton: firstFilter.includes(value) ? false : true,
    }));
  };

  const courseTypeSelectedIcon = (itemValue) => (itemValue === itemMenuSelected ? (
    <Icon src={Check} className="ml-2" data-testid="menu-item-icon" />
  ) : null);

  const CustomMenu = React.forwardRef(
    ({ children, style, className, 'aria-labelledby': labeledBy }, ref) => {
      const [value, setValue] = useState('');

      return (
        <div
          ref={ref}
          style={style}
          className={className}
          aria-labelledby={labeledBy}
        >
          <Form.Control
            autoFocus
            className="mx-3 my-2 w-auto"
            placeholder={intl.formatMessage(messages.coursesOrderFilterMenuPlacehoder)}
            onChange={(e) => setValue(e.target.value)}
            value={value}
          />
          <ul className="list-unstyled">
            {React.Children.toArray(children).filter(
              (child) =>
                !value || String(
                  Array.isArray(child.props.children)
                    ? child.props.children[0] // usually the name
                    : child.props.children
                )
                  .toLowerCase()
                  .includes(value.toLowerCase())
            )}
          </ul>
        </div>
      );
    },
  );

  useEffect(() => {
    if (cleanFilters) {
      setItemMenuSelected(defaultItemSelectedText);
    }
  }, [cleanFilters]);

  return (
    <Dropdown id={`dropdown-toggle-${idProp}`}>
      <Dropdown.Toggle
        alt="dropdown-toggle-menu-items"
        id={idProp}
        variant="none"
        className="dropdown-toggle-menu-items"
        data-testid={idProp}
      >
        {itemMenuSelected}
      </Dropdown.Toggle>
      <Dropdown.Menu
        as={useCustomMenu ? CustomMenu : undefined}
          className="limit-height"
      >
        {menuItems.map(({ id, name, value }) => (
          <Dropdown.Item
            key={id}
            onClick={() => handleCourseTypeSelected(name, value)}
            data-testid={`item-menu-${id}`}
          >
            {name} {courseTypeSelectedIcon(name)}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
};

CoursesFilterMenu.defaultProps = {
  defaultItemSelectedText: '',
  menuItems: [],
};

CoursesFilterMenu.propTypes = {
  onItemMenuSelected: PropTypes.func.isRequired,
  defaultItemSelectedText: PropTypes.string,
  id: PropTypes.string.isRequired,
  menuItems: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
    }),
  ),
};

export default CoursesFilterMenu;
