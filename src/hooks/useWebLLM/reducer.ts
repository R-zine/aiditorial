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
}

export const initialState: IState = {
  model: null,
  mode: "Standard",
  isLoading: false,
  loadingData: null,
  messages: [],
};

export interface IAction {
  type: "changeModel" | "changeMode" | "updateLoading" | "addMessage" | "clear";
  payload: any;
}

export function reducer(state: IState, action: IAction): IState {
  const { type, payload } = action;
  if (type === "changeModel") return { ...state, model: payload };
  if (type === "changeMode") return { ...state, mode: payload };
  if (type === "updateLoading")
    return {
      ...state,
      isLoading: payload.isLoading,
      loadingData: payload.loadingData,
    };
  if (type === "addMessage")
    return { ...state, messages: [...state.messages, payload] };
  return { ...state, messages: [] };
}
