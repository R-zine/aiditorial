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
}

export const initialState: IState = {
  model: null,
  mode: "Standard",
  isLoading: false,
  loadingData: null,
  messages: [],
  isReplying: false,
};

export interface IAction {
  type:
    | "changeModel"
    | "changeMode"
    | "updateLoading"
    | "addMessage"
    | "toogle-isReplying"
    | "clear";
  payload: any;
}

export function reducer(state: IState, action: IAction): IState {
  const { type, payload } = action;
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
  if (type === "toogle-isReplying")
    return { ...state, isReplying: !state.isReplying };
  return { ...state, messages: [] };
}
