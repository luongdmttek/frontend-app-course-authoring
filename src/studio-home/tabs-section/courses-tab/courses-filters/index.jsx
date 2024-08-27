import { useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { SearchField } from '@openedx/paragon';
import { debounce } from 'lodash';

import { getStudioHomeCoursesParams } from '../../../data/selectors';
import { updateStudioHomeCoursesCustomParams } from '../../../data/slice';
import { fetchStudioHomeData } from '../../../data/thunks';
import { LoadingSpinner } from '../../../../generic/Loading';
import CoursesTypesFilterMenu from './courses-types-filter-menu';
import CoursesOrderFilterMenu from './courses-order-filter-menu';
import CoursesOrgFilterMenu from './courses-org-filter-menu';
import CoursesRunFilterMenu from './courses-run-filter-menu';
import './index.scss';

/* regex to check if a string has only whitespace
  example "    "
*/
const regexOnlyWhiteSpaces = /^\s+$/;

const CoursesFilters = ({
  dispatch,
  locationValue,
  onSubmitSearchField,
  isLoading,
  coursesData,
}) => {
  const [allCoursesData, setCoursesData] = useState(coursesData);
  const [stateFilter, setStateFilter] = useState({
    stateRun: undefined,
    stateOrder: 'display_name',
    stateActiveOnly: undefined,
    stateOrgDefault: undefined,
    stateArchivedOnly: undefined,
  });

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
  
  const orgList = allCoursesData
  .map(course => ({
    id: course.orgDefault,
    name: course.orgDefault,
    value: course.orgDefault
  }))
  .filter((value, index, list) => {
    return list.findIndex(o => {
      return JSON.stringify(o) === JSON.stringify(value)
    }) === index
  });
  
  const runList = allCoursesData
  .map(course => ({
    id: course.run,
    name: course.run,
    value: course.run
  }))
  .filter((value, index, list) => {
    return list.findIndex(o => {
      return JSON.stringify(o) === JSON.stringify(value)
    }) === index
  });

  const allOrgOrderList = [
    {
      id: 'all_organization',
      name: 'All organization',
      value: 'allOrganization'
    }, ...orgList
  ];

  const allRunOrderList = [
    {
      id: 'all_course_run',
      name: 'All course run',
      value: 'allCourseRun'
    }, ...runList
  ];

  const getFilterTypeData = (baseFilters) => ({
    archivedCourses: { ...baseFilters, archivedOnly: true, activeOnly: undefined },
    activeCourses: { ...baseFilters, activeOnly: true, archivedOnly: undefined },
    allCourses: { ...baseFilters, archivedOnly: undefined, activeOnly: undefined },
    azCourses: { ...baseFilters, order: 'display_name' },
    zaCourses: { ...baseFilters, order: '-display_name' },
    newestCourses: { ...baseFilters, order: '-created' },
    oldestCourses: { ...baseFilters, order: 'created' },
  });

  const objAllOrganization = (baseFilters) => Object.fromEntries(
    allOrgOrderList.map(key => [key.value, {
      ...baseFilters,
      orgDefault: key.value == 'allOrganization' ? undefined : key.value,
    }]),
  )
  
  const objAllCourseRun = (baseFilters) => Object.fromEntries(
    allRunOrderList.map(key => [key.value, {
      ...baseFilters,
      run: key.value == 'allCourseRun' ? undefined : key.value,
    }]),
  )

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
      objAllOrganization(baseFilters), 
      objAllCourseRun(baseFilters)
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
    dispatch(fetchStudioHomeData(locationValue, false, { page: 1, ...customParams }, true));

    setStateFilter(state => {
      state.stateRun = filterParamsFormat.run;
      state.stateOrder = filterParamsFormat.order;
      state.stateActiveOnly = filterParamsFormat.activeOnly;
      state.stateOrgDefault = filterParamsFormat.orgDefault;
      state.stateArchivedOnly = filterParamsFormat.archivedOnly;
      return state;
    });
  };

  const handleSearchCourses = (searchValueDebounced, stateFilter) => {
    const valueFormatted = searchValueDebounced.trim();
    const filterParams = {
      search: valueFormatted.length > 0 ? valueFormatted : undefined,
      run: stateFilter.stateRun,
      order: stateFilter.stateOrder,
      activeOnly: stateFilter.stateActiveOnly,
      orgDefault: stateFilter.stateOrgDefault,
      archivedOnly: stateFilter.archivedCourses,
    };
    const hasOnlySpaces = regexOnlyWhiteSpaces.test(searchValueDebounced);

    if (valueFormatted !== search && !hasOnlySpaces && !cleanFilters) {
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
    debounce((value) => handleSearchCourses(value, stateFilter), 400),
    [],
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
      <CoursesOrgFilterMenu onItemMenuSelected={handleMenuFilterItemSelected} coursesData={allOrgOrderList}/>
      <CoursesRunFilterMenu onItemMenuSelected={handleMenuFilterItemSelected} coursesData={allRunOrderList} />
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
