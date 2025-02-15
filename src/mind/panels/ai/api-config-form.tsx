import { Collapse, Form, Input, Select, Switch } from "antd";
import { extractContentFromOllamaChunk, extractContentFromSiliconFlowChunk, extractResponseFromChunk } from "./helper";
import { LLMStreamApiCallParams } from "@/mind/use-llm-stream-call";

export enum LLMProviderType {
  OLLAMA = 'ollama',
  SILICON_FLOW = 'silicon-flow',
  CUSTOM = 'custom',
}

interface OllamaApiConfig {
  host?: string;
  modelName: string;
  stream?: boolean;
}
interface SiliconFlowApiConfig {
  apiKey: string;
  modelName: string;
  stream?: boolean;
}

export interface ApiConfig {
  modelName?: string;
  url: string;
  stream?: boolean;
  responsePath?: string;
  apiKey?: string;
}

export type LLMApiConfig = 
  { provider: LLMProviderType.OLLAMA; config: OllamaApiConfig } |
  { provider: LLMProviderType.SILICON_FLOW; config: SiliconFlowApiConfig } |
  { provider: LLMProviderType.CUSTOM; config: ApiConfig }

interface LLMCallParams {
  prompt: string;
  messages?: { role: string; content: string; }[];
  temperature?: number;
  topP?: number;
}

export function getLLMCallParams(llmApiConfig: LLMApiConfig): (params: LLMCallParams) => LLMStreamApiCallParams {
  const { provider, config } = llmApiConfig;
  if (provider === LLMProviderType.OLLAMA) {
    return ({
      prompt,
      messages,
      temperature = 0.1,
      topP = 0.9,
    }: LLMCallParams) => ({
      url: `${config.host || 'http://localhost:11434'}/api/chat`,
      method: 'POST',
      body: JSON.stringify({
        prompt,
        messages,
        model: config.modelName,
        stream: config.stream,
        options: {
          temperature,
          top_p: topP,
        },
        response_format: {
          type: 'text',
        },
      }),
      responseTransform: extractContentFromOllamaChunk,
    });
  } else if (provider === LLMProviderType.SILICON_FLOW) {
    return ({
      prompt,
      messages,
      temperature = 0.1,
      topP = 0.9,
    }: LLMCallParams) => ({
      url: 'https://api.siliconflow.cn/v1/chat/completions',
      method: 'POST',
      body: JSON.stringify({
        model: config.modelName,
        prompt,
        messages,
        stream: config.stream,
        temperature,
        top_p: topP,
      }),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      responseTransform: extractContentFromSiliconFlowChunk,
    });
  }
  return ({
    prompt,
    messages,
    temperature = 0.1,
    topP = 0.9,
  }: LLMCallParams) => ({
    url: config.url,
    method: 'POST',
    body: JSON.stringify({
      prompt,
      messages,
      model: config.modelName,
      stream: config.stream,
      options: {
        temperature,
        top_p: topP,
      },
      response_format: {
        type: 'text',
      },
    }),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    responseTransform: (chunk: string) => extractResponseFromChunk(chunk, config.responsePath),
  })
}

export function APiConfigForm() {
  return (
    <>
      <Form.Item
        label="接口(url)"
        name="url"
        rules={[{ required: true, message: '请输入接口 URL' }]}
      >
        <Input placeholder="请输入接口 URL" />
      </Form.Item>
      <Form.Item
        label="模型名"
        name="modelName"
      >
        <Input placeholder="请输入模型名" />
      </Form.Item>
      {/* <Form.Item
        label="是否流式"
        name="stream"
        valuePropName="checked"
      >
        <Switch checked={true} />
      </Form.Item> */}
      <Form.Item
        label="API Key"
        name="apiKey"
      >
        <Input placeholder="请输入 API Key" />
      </Form.Item>
      <Form.Item
        label="Response路径"
        name="responsePath"
      >
        <Input placeholder="请输入 Response 路径" />
      </Form.Item>
      <Form.Item
        label="Response脚本"
        name="responseTransform"
      >
        <Input.TextArea placeholder="请输入 Response 转换脚本" />
      </Form.Item>
    </>
  );
};

export function OllamaApiConfigForm() {
  return (
    <>
      <Form.Item
        label="Host"
        name="host"
      >
        <Input placeholder="请输入 Host" />
      </Form.Item>
      <Form.Item
        label="模型名"
        name="modelName"
        rules={[{ required: true, message: '请输入模型名' }]}
      >
        <Input placeholder="请输入模型名" />
      </Form.Item>
      <Form.Item
        label="是否流式"
        name="stream"
        valuePropName="checked"
      >
        <Switch checked={true} />
      </Form.Item>
    </>
  )
}

export function SiliconFlowApiConfigForm() {
  return (
    <>
      <Form.Item
        label="API Key"
        name="apiKey"
        rules={[{ required: true, message: '请输入 API Key' }]}
      >
        <Input placeholder="请输入 API Key" />
      </Form.Item>
      <Form.Item
        label="模型名"
        name="modelName"
        rules={[{ required: true, message: '请输入模型名' }]}
      > 
        <Input placeholder="请输入模型名" />
      </Form.Item>
      <Form.Item
        label="是否流式"
        name="stream"
        valuePropName="checked"
      >
        <Switch checked={true} />
      </Form.Item>
    </>
  )
}

const llmProviderOptions: { label: string; value: string; apiConfig: LLMApiConfig }[] = [
  {
    label: "Ollama",
    value: LLMProviderType.OLLAMA,
    apiConfig: {
      provider: LLMProviderType.OLLAMA,
      config: {
        host: 'http://localhost:11434',
        modelName: 'deepseek-r1:1.5b',
        stream: true,
      }
    },
  },
  {
    label: "硅基流动",
    value: LLMProviderType.SILICON_FLOW,
    apiConfig: {
      provider: LLMProviderType.SILICON_FLOW,
      config: {
        apiKey: 'sk-****',
        modelName: 'Qwen/Qwen2.5-7B-Instruct',
        stream: true,
      },
    },
  },
  {
    label: "Custom",
    value: LLMProviderType.CUSTOM,
    apiConfig: {
      provider: LLMProviderType.CUSTOM,
      config: {
        url: 'http://localhost:3000/api/fe-plugin/mind-map-gen-stream',
        modelName: '',
        stream: true,
        responsePath: '',
        apiKey: '',
      }
    }
  },
]

export function APiConfigFormCollapse({
  values,
  onChange,
}: {
  values?: LLMApiConfig;
  onChange: (values: LLMApiConfig) => void;
}) {
  const [form] = Form.useForm();
  const setConfig = (
    <div onClick={e => e.stopPropagation()} style={{ marginLeft: 12, display: 'inline-block' }}>
      平台：
      <Select<string, { label: string; value: string; apiConfig: LLMApiConfig }>
        size="small"
        style={{ width: 100 }}
        value={values?.provider ?? LLMProviderType.CUSTOM}
        onChange={(val, option) => {
          if (!Array.isArray(option)) {
            form.setFieldsValue(option.apiConfig.config);
            onChange(option.apiConfig);
          }
        }}
        options={llmProviderOptions}
      />
    </div>
  );
  return (
    <Form
      size="small"
      form={form}
      onValuesChange={(val, newValues) => onChange({
        provider: values?.provider ?? LLMProviderType.CUSTOM,
        config: newValues,
      })}
      initialValues={values?.config}
      labelCol={{ span: 6 }}
    >
      <Collapse>
        <Collapse.Panel header={<>模型/接口配置 {setConfig}</>} key="1">
          {values?.provider === LLMProviderType.OLLAMA && (
            <OllamaApiConfigForm />
          )}
          {values?.provider === LLMProviderType.SILICON_FLOW && (
            <SiliconFlowApiConfigForm />
          )}
          {(!values?.provider || values?.provider === LLMProviderType.CUSTOM) && (
            <APiConfigForm />
          )}
        </Collapse.Panel>
      </Collapse>
    </Form>
  );
}