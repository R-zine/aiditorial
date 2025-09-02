export interface IState {
  model: string | null;
  mode: "Standard" | "Separate" | "Separate with comparison";
  isLoading: boolean;
  loadingData: {
    percent: number;
    message: string;
  } | null;
  messages: {
    content: "string";
    role: "user" | "assistant";
  }[];
  isReplying: boolean;
  temperature: number;
  isCache: boolean;
}

export const initialState: IState = {
  model: null,
  mode: "Standard",
  isLoading: false,
  loadingData: null,
  messages: [],
  isReplying: false,
  temperature: 0,
  isCache: true,
};

export interface IAction {
  type:
    | "restoreState"
    | "changeModel"
    | "changeMode"
    | "updateLoading"
    | "addMessage"
    | "toggleIsReplying"
    | "changeTemperature"
    | "toggleCache"
    | "clear";
  payload: any;
}

export function reducer(state: IState, action: IAction): IState {
  const { type, payload } = action;
  if (type === "restoreState")
    return {
      ...initialState,
      ...payload,
      id: undefined,
      prompt: undefined,
    };
  if (type === "changeModel")
    return {
      ...state,
      model: payload,
      isLoading: true,
      loadingData: { percent: 0, message: "Preparing to fetch your model" },
    };
  if (type === "changeMode") return { ...state, mode: payload };
  if (type === "updateLoading")
    return {
      ...state,
      isLoading: payload.isLoading,
      loadingData: payload.loadingData,
    };
  if (type === "addMessage")
    return { ...state, messages: [...state.messages, payload] };
  if (type === "toggleIsReplying")
    return { ...state, isReplying: !state.isReplying };
  if (type === "toggleCache") return { ...state, isCache: !state.isCache };
  if (type === "changeTemperature")
    return { ...state, temperature: action.payload };
  return { ...state, messages: [] };
}
