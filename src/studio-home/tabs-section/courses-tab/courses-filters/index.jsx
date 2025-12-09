import { useState, useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { SearchField } from '@openedx/paragon';
import { debounce } from 'lodash';
import { useIntl } from '@edx/frontend-platform/i18n';
import { getConfig } from '@edx/frontend-platform';

import { getStudioHomeCoursesParams } from '../../../data/selectors';
import { updateStudioHomeCoursesCustomParams } from '../../../data/slice';
import { fetchStudioHomeData } from '../../../data/thunks';
import { LoadingSpinner } from '../../../../generic/Loading';
import CoursesTypesFilterMenu from './courses-types-filter-menu';
import CoursesOrderFilterMenu from './courses-order-filter-menu';
import './index.scss';
import CoursesOrgFilterMenu from './courses-org-filter-menu';
import CoursesRunFilterMenu from './courses-run-filter-menu';
import messagesOrgFilter from './courses-org-filter-menu/messages';
import messagesRunFilter from './courses-run-filter-menu/messages';

/* regex to check if a string has only whitespace
  example "    "
*/
const regexOnlyWhiteSpaces = /^\s+$/;

const CoursesFilters = ({
  dispatch,
  locationValue,
  onSubmitSearchField,
  isLoading,
  coursesDataItems,
  courseRunList,
  orgDefaultList,
}) => {
  const intl = useIntl();
  const isPaginated = getConfig().ENABLE_HOME_PAGE_COURSE_API_V2;
  const [allOrgOrderList, setAllOrgOrderList] = useState([]);
  const [allRunOrderList, setAllRunOrderList] = useState([]);
  const studioHomeCoursesParams = useSelector(getStudioHomeCoursesParams);
  const {
    run,
    order,
    search,
    activeOnly,
    orgDefault,
    archivedOnly,
    cleanFilters,
  } = studioHomeCoursesParams;
  const [inputSearchValue, setInputSearchValue] = useState('');

  function getCourseRunList() {
    const runList = courseRunList
    .map(item => ({
      id: item,
      name: item,
      value: item
    }));
  
    setAllRunOrderList([
      {
        id: 'all_course_run',
        name: `${intl.formatMessage(messagesRunFilter.coursesRunFilterMenuAll)}`, //'All courses run',
        value: 'allCourseRun'
      },
      ...runList
    ])
  }

  function getOrganizationList() {
    const orgList = orgDefaultList
    .map(item => ({
      id: item,
      name: item,
      value: item
    }));

    setAllOrgOrderList([
      {
        id: 'all_organization',
        name: `${intl.formatMessage(messagesOrgFilter.coursesOrgFilterMenuAllOrganization)}`, //'All organization',
        value: 'allOrganization'
      },
      ...orgList
    ])
  }

  useEffect(() => {
    if(isPaginated) {
      getCourseRunList();
      getOrganizationList();
    }
  }, [])

  const objAllCourseRun = (baseFilters) => Object.fromEntries(
    allRunOrderList.map(key => [key.value, {
      ...baseFilters,
      run: key.value == 'allCourseRun' ? undefined : key.value,
    }]),
  )

  const objAllOrganization = (baseFilters) => Object.fromEntries(
    allOrgOrderList.map(key => [key.value, {
      ...baseFilters,
      orgDefault: key.value == 'allOrganization' ? undefined : key.value,
    }]),
  )

  const getFilterTypeData = (baseFilters) => ({
    archivedCourses: { ...baseFilters, archivedOnly: true, activeOnly: undefined },
    activeCourses: { ...baseFilters, activeOnly: true, archivedOnly: undefined },
    allCourses: { ...baseFilters, archivedOnly: undefined, activeOnly: undefined },
    azCourses: { ...baseFilters, order: 'display_name' },
    zaCourses: { ...baseFilters, order: '-display_name' },
    newestCourses: { ...baseFilters, order: '-created' },
    oldestCourses: { ...baseFilters, order: 'created' },
    allCourseRun: { ...baseFilters, run: undefined },
    allOrganization: { ...baseFilters, orgDefault: undefined },
  });

  const handleMenuFilterItemSelected = (filterType) => {
    const baseFilters = {
      currentPage: 1,
      search,
      order,
      isFiltered: true,
      archivedOnly,
      activeOnly,
      cleanFilters: false,
      orgDefault,
      run,
    };

    const getFilterTypeAllData = (baseFilters) => Object.assign(
      getFilterTypeData(baseFilters), 
      objAllCourseRun(baseFilters),
      objAllOrganization(baseFilters)
    );

    const filterParams = getFilterTypeAllData(baseFilters);
    const filterParamsFormat = filterParams[filterType] || baseFilters;
    const {
      coursesOrderLabel,
      coursesTypesLabel,
      isFiltered,
      orderTypeLabel,
      cleanFilters: cleanFilterParams,
      currentPage,
      ...customParams
    } = filterParamsFormat;
    dispatch(updateStudioHomeCoursesCustomParams(filterParamsFormat));
    // dispatch(fetchStudioHomeData(locationValue, false, { page: 1, ...customParams }, true));
  };

  const handleSearchCourses = (searchValueDebounced) => {
    const valueFormatted = searchValueDebounced.trim();
    const filterParams = {
      search: valueFormatted.length > 0 ? valueFormatted : undefined,
      activeOnly,
      archivedOnly,
      order,
      orgDefault,
      run,
    };
    const hasOnlySpaces = regexOnlyWhiteSpaces.test(searchValueDebounced);

    if (valueFormatted !== search && !hasOnlySpaces) {
      dispatch(updateStudioHomeCoursesCustomParams({
        currentPage: 1,
        isFiltered: true,
        cleanFilters: false,
        ...filterParams,
      }));

      dispatch(fetchStudioHomeData(locationValue, false, { page: 1, ...filterParams }, true));
    }

    setInputSearchValue(searchValueDebounced);
  };

  const handleSearchCoursesDebounced = useCallback(
    debounce((value) => handleSearchCourses(value), 600),
    [activeOnly, archivedOnly, order, inputSearchValue, orgDefault, run],
  );

  return (
    <div className="d-flex">
      <div className="d-flex flex-row">
        <SearchField
          onSubmit={onSubmitSearchField}
          onChange={handleSearchCoursesDebounced}
          value={cleanFilters ? '' : inputSearchValue}
          className="mr-2"
          data-testid="input-filter-courses-search"
          placeholder="Search"
        />
        {isLoading && (
          <span className="search-field-loading" data-testid="loading-search-spinner">
            <LoadingSpinner size="sm" />
          </span>
        )}
      </div>

      <CoursesTypesFilterMenu onItemMenuSelected={handleMenuFilterItemSelected} />
      <CoursesOrderFilterMenu onItemMenuSelected={handleMenuFilterItemSelected} />
      {isPaginated && 
        <>
          <CoursesOrgFilterMenu onItemMenuSelected={handleMenuFilterItemSelected} filterOrgData={allOrgOrderList} />
          <CoursesRunFilterMenu onItemMenuSelected={handleMenuFilterItemSelected} filterRunData={allRunOrderList} />
        </>
      }
    </div>
  );
};

CoursesFilters.defaultProps = {
  locationValue: '',
  onSubmitSearchField: () => {},
  isLoading: false,
};

CoursesFilters.propTypes = {
  dispatch: PropTypes.func.isRequired,
  locationValue: PropTypes.string,
  onSubmitSearchField: PropTypes.func,
  isLoading: PropTypes.bool,
};

export default CoursesFilters;
