import { Injectable } from '@angular/core';

export interface IFormItem {
  name: string;
  widget: string;
}

@Injectable()
export class WidgetDataService {
  private _items: IFormItem[] = [];

  constructor() {
    const data = localStorage.getItem('WidgetDataServiceData');
    if (data) {
      this._items = JSON.parse(data) || [];
    }

    if (this._items.length === 0) {
      this._items.push({ name: 'boolean', widget: 'boolean' });
      this._items.push({ name: 'checkbox', widget: 'boolean' });
      this._items.push({ name: 'tick', widget: 'boolean' });

      this._items.push({ name: 'datetime', widget: 'datetime' });
      this._items.push({ name: 'start date', widget: 'datetime' });
      this._items.push({ name: 'end date', widget: 'datetime' });
      this._items.push({ name: 'date of birth', widget: 'datetime' });
      this._items.push({ name: 'dob', widget: 'datetime' });

      this._items.push({ name: 'multilinetext', widget: 'multilinetext' });
      this._items.push({ name: 'multi line text', widget: 'multilinetext' });
      this._items.push({ name: 'comments', widget: 'multilinetext' });

      this._items.push({ name: 'number', widget: 'number' });

      this._items.push({ name: 'textbox', widget: 'textbox' });
      this._items.push({ name: 'phone', widget: 'textbox' });
      this._items.push({ name: 'text', widget: 'textbox' });
      this._items.push({ name: 'first name', widget: 'textbox' });
      this._items.push({ name: 'last name', widget: 'textbox' });
      this._items.push({ name: 'address', widget: 'textbox' });
      this._items.push({ name: 'address line 1', widget: 'textbox' });
      this._items.push({ name: 'address line 2', widget: 'textbox' });

      this._items.push({ name: 'hyperlink', widget: 'hyperlink' });
      this._items.push({ name: 'url', widget: 'hyperlink' });

      this._items.push({ name: 'email', widget: 'email' });
      this._items.push({ name: 'email address', widget: 'email' });
      this._items.push({ name: 'e-mail', widget: 'email' });

      this._items.push({ name: 'file-upload', widget: 'file-upload' });
      this._items.push({ name: 'file upload', widget: 'file-upload' });
      this._items.push({ name: 'file', widget: 'file-upload' });
    }
  }

  public items() {
    return this._items;
  }

  public addItem(item: IFormItem) {
    this._items.push(item);
    localStorage.setItem('WidgetDataServiceData', JSON.stringify(this._items));
  }
}
