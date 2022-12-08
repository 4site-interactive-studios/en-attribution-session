export class CrossDomainStorage {
  private origin: string;
  private path: string;
  private iframe: HTMLIFrameElement | null;
  private iframeReady: boolean;
  private queue: Array<any>;
  private requests: { [key: string]: any };
  private id: number;

  constructor(origin: string, path: string) {
    this.origin = origin;
    this.path = path;
    this.iframe = null;
    this.iframeReady = false;
    this.queue = [];
    this.requests = {};
    this.id = 0;
  }

  public init() {
    if (!this.iframe) {
      if (window.JSON && window.localStorage) {
        this.iframe = document.createElement('iframe');
        this.iframe.style.cssText =
          'position:absolute;width:1px;height:1px;left:-9999px;';
        document.body.appendChild(this.iframe);

        if (window.addEventListener) {
          this.iframe.addEventListener(
            'load',
            () => {
              this._iframeLoaded();
            },
            false
          );
          window.addEventListener(
            'message',
            (event) => {
              this._handleMessage(event);
            },
            false
          );
        }
      } else {
        throw new Error('Unsupported browser.');
      }
    }

    this.iframe.src = this.origin + this.path;
  }

  public storeValue(key: string, value: string, callback: (arg: any) => any) {
    this.callURL(this.origin + this.path).then((result) => {
      if (result != 200) {
        // Cancel cross-domain cookie processing if iframe doesn't load
        callback({ message: 'invalid iframe' });
      } else {
        this._processRequest(
          {
            key: key,
            value: value,
            id: ++this.id,
            operation: 'write',
          },
          callback
        );
      }
    });
  }

  public requestValue(key: string, callback: (arg: any) => any) {
    this.callURL(this.origin + this.path).then((result) => {
      if (result != 200) {
        // Cancel cross-domain cookie processing if iframe doesn't load
        callback({ message: 'invalid iframe' });
      } else {
        this._processRequest(
          { key: key, id: ++this.id, operation: 'read' },
          callback
        );
      }
    });
  }

  private _processRequest(
    request: { [key: string]: any },
    callback: (arg: any) => any
  ) {
    const data = {
      request: request,
      callback: callback,
    };
    if (this.iframeReady) {
      this._sendRequest(data);
    } else {
      this.queue.push(data);
    }

    if (!this.iframe) {
      this.init();
    }
  }

  private _sendRequest(data: { [key: string]: any }) {
    this.requests[data.request.id] = data;
    this!.iframe!.contentWindow!.postMessage(
      JSON.stringify(data.request),
      this.origin
    );
  }

  private _iframeLoaded() {
    this.iframeReady = true;

    if (this.queue.length) {
      for (let i = 0, len = this.queue.length; i < len; i++) {
        this._sendRequest(this.queue[i]);
      }
      this.queue = [];
    }
  }

  private _handleMessage(event: MessageEvent) {
    if (event.origin === this.origin) {
      const d = JSON.parse(event.data);
      if (this.requests[d.id]) {
        if (typeof this.requests[d.id].callback === 'function') {
          this.requests[d.id].callback(d);
        }
      }
      delete this.requests[d.id];
    }
  }

  private async callURL(url: string) {
    const response = await fetch(url);
    return response.status;
  }
}
