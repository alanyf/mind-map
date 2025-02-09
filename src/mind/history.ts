// 最大历史栈长度
const MAX_HISTORY_LENGTH = 100;

// 获取数组最后一个元素
const last = (arr: any[]) => arr[arr.length - 1];

// export interface IHistoryRecord {
//   // 只读属性
//   readonly currentValue: string;
//   readonly canUndo: boolean;
//   readonly canRedo: boolean;

//   // 方法
//   isFull(): boolean;
//   push(value: string): void;
//   undo(): boolean;
//   redo(): boolean;
//   clear(): void;
// }

export class HistoryRecord {
  private stack: string[] = [];

  private undoStack: string[][] = [];

  private _currentValue: string = '';

  private maxLength: number = MAX_HISTORY_LENGTH;

  private _changeListeners: (() => void)[] = [];

  constructor(maxLength = MAX_HISTORY_LENGTH) {
    // 最大历史栈长度
    this.maxLength = maxLength;
  }

  /**
   * 当前值
   */
  get currentValue() {
    return this._currentValue;
  }

  get canUndo() {
    return this.stack.length > 0;
  }

  get canRedo() {
    return this.undoStack.length > 0;
  }

  /**
   * 是否满
   */
  isFull() {
    return this.stack.length >= this.maxLength;
  }

  /**
   * 添加历史记录
   * @param {*} value 历史记录值
   */
  push(value: string) {
    this.stack.push(value);
    this.undoStack = [];
    this._currentValue = value;
    if (this.stack.length > this.maxLength) {
      this.stack.splice(0, 1);
    }
  }

  /**
   * 撤销
   */
  undo() {
    if (this.stack.length === 0) {
      return false;
    }
    const value = this.stack.pop() || '';
    this.undoStack.push([value]);
    this._currentValue = last(this.stack);
    this._triggerChange();
    return true;
  }

  /**
   * 重做
   */
  redo() {
    if (this.undoStack.length === 0) {
      return false;
    }
    const valueList = this.undoStack.pop() || [];
    this.stack.push(...valueList);
    this._currentValue = last(this.stack);
    this._triggerChange();
    return true;
  }

  /**
   * 清空历史栈
   */
  clear() {
    this.undoStack.push([...this.stack]);
    this.stack = [];
  }

  /**
   * 监听
   */
  onChange(fn: () => void) {
    this._changeListeners.push(fn);
    return () => {
      this._changeListeners = this._changeListeners.filter(e => e !== fn);
    };
  }

  private _triggerChange() {
    this._changeListeners.forEach(fn => fn());
  }
}
