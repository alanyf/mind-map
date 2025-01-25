import { useRef, useState } from 'react';

export enum RespondingStatus {
  Inactive = 'Inactive',
  Starting = 'Starting',
  End = 'End',
}

const generateTextQuery = (
  url: string,
  onChange: (generatedText: string) => void,
  onFinish?: () => void,
): { abort: () => void } => {
  const controller = new AbortController();
  const { signal } = controller;

  fetch(`${url}`, {
    method: 'GET',
    signal,
  })
    .then(response => {
      if (!response.body) {
        onFinish?.();
        return;
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      const readChunk = () => {
        reader
          .read()
          .then(({ done, value }) => {
            if (done) {
              onFinish?.();
              return;
            }
            const chunk = decoder.decode(value, { stream: true });
            onChange(chunk);
            // 继续读取下一个数据块
            readChunk();
          })
          .catch(error => {
            if (error.name === 'AbortError') {
              // eslint-disable-next-line no-console
              console.log('Request aborted');
            } else {
              console.error('Error reading stream:', error);
            }
            onFinish?.();
          });
      };

      readChunk(); // 开始读取数据块
    })
    .catch(error => {
      if (error.name === 'AbortError') {
        // eslint-disable-next-line no-console
        console.log('Request canceled');
      } else {
        console.error('Error fetching data:', error);
      }
      onFinish?.();
    });

  return {
    abort: () => {
      controller.abort();
    },
  };
};

export interface LLMStream {
  /**
   * abort 方法，用于终止当前的流操作
   */
  abort: () => void;

  /**
   * start 方法，它接受一个字符串参数 text，用于开始流操作。
   * @param text - 要处理的文本
   */
  start: (params: { url: string }) => void;

  /**
   * respondingStatus 属性，它是一个枚举类型或其他格式，用于指示流的响应状态
   * 例如，可以定义一个枚举类型 RespondingStatus 来表示不同的状态，如 IDLE, RUNNING, ERROR 等。
   */
  respondingStatus: RespondingStatus;

  /**
   * smoothExecuteResult 属性，它是一个字符串，用于存储流操作的平滑执行结果。
   * 这个结果可能是流操作的摘要，或者是一些关键指标的统计信息。
   */
  smoothExecuteResult: string;
}

export const useLLMStreamCall = (): LLMStream => {
  const [smoothExecuteResult, setSmoothExecuteResult] = useState('');
  const [respondingStatus, setRespondingStatus] = useState<RespondingStatus>(
    RespondingStatus.Inactive,
  );
  const abortRef = useRef<undefined | (() => void)>();
  return {
    respondingStatus,
    smoothExecuteResult,
    start: params => {
      const { url } = params;
      setRespondingStatus(RespondingStatus.Starting);
      setSmoothExecuteResult('');
      const { abort } = generateTextQuery(
        url,
        generatedText => {
          setSmoothExecuteResult((oldText: string) => oldText + generatedText);
        },
        () => {
          setRespondingStatus(RespondingStatus.End);
        },
      );
      abortRef.current = abort;
    },
    abort: () => {
      setRespondingStatus(RespondingStatus.End);
      abortRef.current?.();
    },
  };
};
