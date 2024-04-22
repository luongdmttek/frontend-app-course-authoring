/* eslint-disable react/prop-types */
// @ts-check
import React from 'react';
import { IntlProvider } from '@edx/frontend-platform/i18n';
import { initializeMockApp } from '@edx/frontend-platform';
import { AppProvider } from '@edx/frontend-platform/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  fireEvent,
  render,
  waitFor,
  within,
  getByLabelText as getByLabelTextIn,
} from '@testing-library/react';
import fetchMock from 'fetch-mock-jest';

import initializeStore from '../store';
// @ts-ignore
import mockResult from './__mocks__/search-result.json';
// @ts-ignore
import mockEmptyResult from './__mocks__/empty-search-result.json';
import SearchUI from './SearchUI';

// mockResult contains only a single result - this one:
const mockResultDisplayName = 'Test HTML Block';
let store;

const queryClient = new QueryClient();

// Default props for <SearchUI />
const defaults = {
  url: 'http://mock.meilisearch.local/',
  apiKey: 'test-key',
  indexName: 'studio',
  courseId: 'course-v1:org+test+123',
};
const searchEndpoint = 'http://mock.meilisearch.local/multi-search';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'), // use actual for all non-hook parts
  useNavigate: () => mockNavigate,
}));

/** @type {React.FC<{children:React.ReactNode}>} */
const Wrap = ({ children }) => (
  <AppProvider store={store}>
    <IntlProvider locale="en" messages={{}}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </IntlProvider>
  </AppProvider>
);

const returnEmptyResult = (_url, req) => {
  const requestData = JSON.parse(req.body?.toString() ?? '');
  const query = requestData?.queries[0]?.q ?? '';
  // We have to replace the query (search keywords) in the mock results with the actual query,
  // because otherwise Instantsearch will update the UI and change the query,
  // leading to unexpected results in the test cases.
  mockEmptyResult.results[0].query = query;
  // And create the required '_formatted' field; not sure why it's there - seems very redundant. But it's required.
  // eslint-disable-next-line no-underscore-dangle, no-param-reassign
  mockEmptyResult.results[0]?.hits.forEach((hit) => { hit._formatted = { ...hit }; });
  return mockEmptyResult;
};

describe('<SearchUI />', () => {
  beforeEach(async () => {
    initializeMockApp({
      authenticatedUser: {
        userId: 3,
        username: 'abc123',
        administrator: true,
        roles: [],
      },
    });
    store = initializeStore();
    fetchMock.post(searchEndpoint, (_url, req) => {
      const requestData = JSON.parse(req.body?.toString() ?? '');
      const query = requestData?.queries[0]?.q ?? '';
      // We have to replace the query (search keywords) in the mock results with the actual query,
      // because otherwise Instantsearch will update the UI and change the query,
      // leading to unexpected results in the test cases.
      mockResult.results[0].query = query;
      // And create the required '_formatted' field; not sure why it's there - seems very redundant. But it's required.
      // eslint-disable-next-line no-underscore-dangle, no-param-reassign
      mockResult.results[0]?.hits.forEach((hit) => { hit._formatted = { ...hit }; });
      return mockResult;
    });
  });

  afterEach(async () => {
    fetchMock.mockReset();
  });

  it('should render an empty state', async () => {
    const { getByText } = render(<Wrap><SearchUI {...defaults} /></Wrap>);
    // Before the results have even loaded, we see this message:
    expect(getByText('Start searching to find content')).toBeInTheDocument();
    // When this UI loads, Instantsearch makes two queries. I think one to load the facets and one "blank" search.
    await waitFor(() => { expect(fetchMock).toHaveFetchedTimes(2, searchEndpoint, 'post'); });
    // And that message is still displayed even after the initial results/filters have loaded:
    expect(getByText('Start searching to find content')).toBeInTheDocument();
  });

  it('should render an empty state if no result found', async () => {
    fetchMock.post(searchEndpoint, returnEmptyResult, { overwriteRoutes: true });
    const { getByText, getByRole } = render(<Wrap><SearchUI {...defaults} /></Wrap>);
    // Return an empty result set:
    // Before the results have even loaded, we see this message:
    expect(getByText('Start searching to find content')).toBeInTheDocument();
    // When this UI loads, Instantsearch makes two queries. I think one to load the facets and one "blank" search.
    await waitFor(() => { expect(fetchMock).toHaveFetchedTimes(2, searchEndpoint, 'post'); });
    // And that message is still displayed even after the initial results/filters have loaded:
    expect(getByText('Start searching to find content')).toBeInTheDocument();
    // Enter a keyword - search for 'noresults':
    fireEvent.change(getByRole('searchbox'), { target: { value: 'noresults' } });
    // Wait for the new search request to load all the results:
    await waitFor(() => { expect(fetchMock).toHaveFetchedTimes(3, searchEndpoint, 'post'); });
    expect(getByText('We didn\'t find anything matching your search')).toBeInTheDocument();
  });

  it('defaults to searching "All Courses" if used outside of any particular course', async () => {
    const { getByText, queryByText, getByRole } = render(<Wrap><SearchUI {...defaults} courseId="" /></Wrap>);
    // We default to searching all courses:
    expect(getByText('All courses')).toBeInTheDocument();
    expect(queryByText('This course')).toBeNull();
    // Wait for the initial search request that loads all the filter options:
    await waitFor(() => { expect(fetchMock).toHaveFetchedTimes(2, searchEndpoint, 'post'); });
    // Enter a keyword - search for 'giraffe':
    fireEvent.change(getByRole('searchbox'), { target: { value: 'giraffe' } });
    // Wait for the new search request to load all the results:
    await waitFor(() => { expect(fetchMock).toHaveFetchedTimes(3, searchEndpoint, 'post'); });
    // Now we should see the results:
    expect(queryByText('Enter a keyword')).toBeNull();
    // The result:
    expect(getByText('2 results found')).toBeInTheDocument();
    expect(getByText(mockResultDisplayName)).toBeInTheDocument();
    // Breadcrumbs showing where the result came from:
    expect(getByText('The Little Unit That Could')).toBeInTheDocument();

    const resultItem = getByRole('button', { name: /The Little Unit That Could/ });

    // Clicking the "Open in new window" button should open the result in a new window:
    const { open } = window;
    window.open = jest.fn();
    fireEvent.click(within(resultItem).getByRole('button', { name: 'Open in new window' }));
    expect(window.open).toHaveBeenCalledWith(
      '/course/course-v1:edx+TestCourse+24?show=block-v1%3Aedx%2BTestCourse%2B24%2Btype%40html%2Bblock%40test_html',
      '_blank',
    );
    window.open = open;

    // Clicking in the result should navigate to the result's URL:
    fireEvent.click(resultItem);
    expect(mockNavigate).toHaveBeenCalledWith('/course/course-v1:edx+TestCourse+24?show=block-v1%3Aedx%2BTestCourse%2B24%2Btype%40html%2Bblock%40test_html');
  });

  it('defaults to searching "This Course" if used in a course', async () => {
    const { getByText, queryByText, getByRole } = render(<Wrap><SearchUI {...defaults} /></Wrap>);
    // We default to searching all courses:
    expect(getByText('This course')).toBeInTheDocument();
    expect(queryByText('All courses')).toBeNull();
    // Wait for the initial search request that loads all the filter options:
    await waitFor(() => { expect(fetchMock).toHaveFetchedTimes(2, searchEndpoint, 'post'); });
    // Enter a keyword - search for 'giraffe':
    fireEvent.change(getByRole('searchbox'), { target: { value: 'giraffe' } });
    // Wait for the new search request to load all the results:
    await waitFor(() => { expect(fetchMock).toHaveFetchedTimes(3, searchEndpoint, 'post'); });
    // And make sure the request was limited to this course:
    expect(fetchMock).toHaveLastFetched((_url, req) => {
      const requestData = JSON.parse(req.body?.toString() ?? '');
      const requestedFilter = requestData?.queries[0].filter;
      return requestedFilter?.[0] === 'context_key = "course-v1:org+test+123"';
    });
    // Now we should see the results:
    expect(queryByText('Enter a keyword')).toBeNull();
    // The result:
    expect(getByText('2 results found')).toBeInTheDocument();
    expect(getByText(mockResultDisplayName)).toBeInTheDocument();
    // Breadcrumbs showing where the result came from:
    expect(getByText('The Little Unit That Could')).toBeInTheDocument();
  });

  describe('filters', () => {
    /** @type {import('@testing-library/react').RenderResult} */
    let rendered;
    beforeEach(async () => {
      rendered = render(<Wrap><SearchUI {...defaults} /></Wrap>);
      const { getByRole, getByText } = rendered;
      // Wait for the initial search request that loads all the filter options:
      await waitFor(() => { expect(fetchMock).toHaveFetchedTimes(2, searchEndpoint, 'post'); });
      // Enter a keyword - search for 'giraffe':
      fireEvent.change(getByRole('searchbox'), { target: { value: 'giraffe' } });
      // Wait for the new search request to load all the results and the filter options, based on the search so far:
      await waitFor(() => { expect(fetchMock).toHaveFetchedTimes(3, searchEndpoint, 'post'); });
      // And make sure the request was limited to this course:
      expect(fetchMock).toHaveLastFetched((_url, req) => {
        const requestData = JSON.parse(req.body?.toString() ?? '');
        const requestedFilter = requestData?.queries[0].filter;
        return (requestedFilter?.length === 1); // the filter is: 'context_key = "course-v1:org+test+123"'
      });
      // Now we should see the results:
      expect(getByText('2 results found')).toBeInTheDocument();
      expect(getByText(mockResultDisplayName)).toBeInTheDocument();
    });

    it('can filter results by component/XBlock type', async () => {
      const { getByRole } = rendered;
      // Now open the filters menu:
      fireEvent.click(getByRole('button', { name: 'Type' }), {});
      // The dropdown menu has role="group"
      await waitFor(() => { expect(getByRole('group')).toBeInTheDocument(); });
      const popupMenu = getByRole('group');
      const problemFilterCheckbox = getByLabelTextIn(popupMenu, /Problem/i);
      fireEvent.click(problemFilterCheckbox, {});
      // Now wait for the filter to be applied and the new results to be fetched.
      await waitFor(() => { expect(fetchMock).toHaveFetchedTimes(4, searchEndpoint, 'post'); });
      // Because we're mocking the results, there's no actual changes to the mock results,
      // but we can verify that the filter was sent in the request
      expect(fetchMock).toHaveLastFetched((_url, req) => {
        const requestData = JSON.parse(req.body?.toString() ?? '');
        const requestedFilter = requestData?.queries[0].filter;
        return JSON.stringify(requestedFilter) === JSON.stringify([
          'context_key = "course-v1:org+test+123"',
          ['"block_type"="problem"'], // <-- the newly added filter, sent with the request
        ]);
      });
    });

    it('can filter results by tag', async () => {
      const { getByRole, getByLabelText } = rendered;
      // Now open the filters menu:
      fireEvent.click(getByRole('button', { name: 'Tags' }), {});
      // The dropdown menu in this case doesn't have a role; let's just assume it's displayed.
      const competentciesCheckbox = getByLabelText(/ESDC Skills and Competencies/i);
      fireEvent.click(competentciesCheckbox, {});
      // Now wait for the filter to be applied and the new results to be fetched.
      await waitFor(() => { expect(fetchMock).toHaveFetchedTimes(4, searchEndpoint, 'post'); });
      // Because we're mocking the results, there's no actual changes to the mock results,
      // but we can verify that the filter was sent in the request
      expect(fetchMock).toHaveLastFetched((_url, req) => {
        const requestData = JSON.parse(req.body?.toString() ?? '');
        const requestedFilter = requestData?.queries[0].filter;
        return JSON.stringify(requestedFilter) === JSON.stringify([
          'context_key = "course-v1:org+test+123"',
          ['"tags.taxonomy"="ESDC Skills and Competencies"'], // <-- the newly added filter, sent with the request
        ]);
      });
    });
  });
});