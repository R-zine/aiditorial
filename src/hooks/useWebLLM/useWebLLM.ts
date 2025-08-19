import { CreateMLCEngine, MLCEngine, prebuiltAppConfig } from "@mlc-ai/web-llm";
import { useEffect, useMemo, useReducer } from "react";
import { initialState, reducer } from "./reducer";

export const availableModels = prebuiltAppConfig.model_list.map(
  (model) => model.model_id
);

export const useWebLLM = () => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const engineInstance = useMemo(async () => {
    if (!state.model) return null;
    return (async () => {
      // Initialize with a progress callback
      const initProgressCallback = (progress: any) => {
        dispatch({
          type: "updateLoading",
          payload: {
            isLoading: true,
            loadingData: {
              percent: progress.progress,
              message: progress.text,
            },
          },
        });
      };

      // Using CreateMLCEngine
      const engine = await CreateMLCEngine(state.model, {
        initProgressCallback,
      });

      return engine;
    })();
  }, [state.model]);

  useEffect(() => {
    if (engineInstance) {
      (async () => {
        const engine = await engineInstance;
        if (!engine) return;
        const reply = await engine.chat.completions.create({
          messages: state.messages,
        });

        dispatch({ type: "addMessage", payload: reply.choices[0].message });
      })();
    }
  }, [engineInstance, state.messages]);

  return { ...state, dispatch };
};
