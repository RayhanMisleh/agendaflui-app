import { AxiosError, AxiosHeaders } from "axios";

// Adaptador falso do axios para os testes: nenhuma requisição sai do processo.
// handler(call) devolve { status, data, headers } ou lança 'network' | 'timeout'.
// call = { method, url, baseURL, headers (chaves em minúsculas), data (JSON já lido), params }.
export function fakeAdapter(handler) {
  const calls = [];

  async function adapter(config) {
    const headers = {};
    for (const [name, value] of Object.entries(config.headers.toJSON())) {
      headers[name.toLowerCase()] = value;
    }
    let data = config.data;
    if (typeof data === "string") {
      try {
        data = JSON.parse(data);
      } catch (e) {
        // corpo que não é JSON segue como texto
      }
    }
    const call = {
      method: (config.method || "get").toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      headers,
      data,
      params: config.params,
    };
    calls.push(call);

    let result;
    try {
      result = await handler(call);
    } catch (failure) {
      const kind = typeof failure === "string" ? failure : failure instanceof Error ? failure.message : "";
      if (kind === "network") throw new AxiosError("Network Error", "ERR_NETWORK", config, {});
      if (kind === "timeout") throw new AxiosError("timeout of 15000ms exceeded", "ECONNABORTED", config, {});
      throw failure;
    }

    const response = {
      status: result.status,
      statusText: "",
      data: result.data,
      headers: new AxiosHeaders(result.headers || {}),
      config,
      request: {},
    };
    if (result.status >= 200 && result.status < 300) return response;
    throw new AxiosError(
      `Request failed with status code ${result.status}`,
      result.status >= 500 ? "ERR_BAD_RESPONSE" : "ERR_BAD_REQUEST",
      config,
      {},
      response
    );
  }

  adapter.calls = calls;
  return adapter;
}
