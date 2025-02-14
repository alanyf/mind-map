import { message } from 'antd';
import { useRef, useState } from 'react';

export enum RespondingStatus {
  Inactive = 'Inactive',
  Starting = 'Starting',
  End = 'End',
}

const generateTextQuery = (
  params: { url: string; method?: 'POST' | 'GET'; body?: string; headers?: Record<string, string>; },
  onChange: (generatedText: string, fullText: string) => void,
  onFinish?: () => void,
  onError?: (err: Error) => void,
): { abort: () => void } => {
  const controller = new AbortController();
  const { signal } = controller;
  const { url, method = 'GET', body = '', headers = {} } = params;
  fetch(`${url}`, {
    method,
    body,
    signal,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  }).then(async response => {
    if (response.status !== 200) {
      const data = await response.json();
      throw new Error(response.statusText + '\n' + JSON.stringify(data));
    }
    if (!response.body) {
      onFinish?.();
      return;
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let fullText = '';

    function read() {
      reader.read().then(({ done, value }) => {
        const chunk = decoder.decode(value, { stream: true });
        if (done) {
          onFinish?.();
          return;
        }
        fullText += chunk;
        console.log('yf123 chunk:', chunk);
        onChange(chunk, fullText);

        read(); // 继续读取下一个数据块
      }).catch(error => {
        console.error("Error reading stream:", error);
        onFinish?.();
      });
    }
    read(); // 开始读取数据块
  }).catch(error =>  {
    const err = error as Error;
    if (err.name === 'AbortError') {
      // eslint-disable-next-line no-console
      console.log('Request canceled');
    } else {
      console.error('Error fetching data:', err);
    }
    onError?.(err);
  });
  return {
    abort: () => {
      controller.abort();
    },
  };
};

export interface LLMStreamApiCallParams {
  url: string;
  method?: 'POST' | 'GET';
  body?: string;
  headers?: Record<string, string>;
  responseTransform?: (data: string) => string;
}

export interface LLMStream {
  /**
   * abort 方法，用于终止当前的流操作
   */
  abort: () => void;

  /**
   * start 方法，它接受一个字符串参数 text，用于开始流操作。
   * @param text - 要处理的文本
   */
  start: (params: LLMStreamApiCallParams) => void;

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
      const { responseTransform } = params;
      setRespondingStatus(RespondingStatus.Starting);
      setSmoothExecuteResult('');
      const { abort } = generateTextQuery(
        params,
        generatedText => {
          setSmoothExecuteResult((oldText: string) => oldText + (responseTransform ? responseTransform(generatedText) : generatedText));
        },
        () => {
          setRespondingStatus(RespondingStatus.End);
        },
        (err) => {
          message.error(err.message);
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
