import moment from "moment";

// Define Action Types
export const FETCH_INCIDENTS_REQUESTED = "FETCH_INCIDENTS_REQUESTED";
export const FETCH_INCIDENTS_COMPLETED = "FETCH_INCIDENTS_COMPLETED";
export const FETCH_INCIDENTS_ERROR = "FETCH_INCIDENTS_ERROR";

export const UPDATE_INCIDENTS_LIST = "UPDATE_INCIDENTS_LIST";
export const UPDATE_INCIDENTS_LIST_COMPLETED = "UPDATE_INCIDENTS_LIST_COMPLETED";
export const UPDATE_INCIDENTS_LIST_ERROR = "UPDATE_INCIDENTS_LIST_ERROR";

export const FILTER_INCIDENTS_LIST_BY_PRIORITY = "FILTER_INCIDENTS_LIST_BY_PRIORITY";
export const FILTER_INCIDENTS_LIST_BY_PRIORITY_COMPLETED = "FILTER_INCIDENTS_LIST_BY_PRIORITY_COMPLETED";
export const FILTER_INCIDENTS_LIST_BY_PRIORITY_ERROR = "FILTER_INCIDENTS_LIST_BY_PRIORITY_ERROR";

// Define Actions
export const getIncidentsAsync = () => ({
  type: FETCH_INCIDENTS_REQUESTED,
});

export const updateIncidentsListAsync = (addList, updateList, removeList) => ({
  type: UPDATE_INCIDENTS_LIST,
  addList,
  updateList,
  removeList
});

export const filterIncidentsByPriority = (incidentPriority = []) => ({
  type: FILTER_INCIDENTS_LIST_BY_PRIORITY,
  incidentPriority
});