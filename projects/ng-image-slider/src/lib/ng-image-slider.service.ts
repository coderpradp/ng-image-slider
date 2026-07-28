import { Injectable } from '@angular/core';
import { SliderOrderType } from './ng-image-slider.models';

const DESC: SliderOrderType = 'DESC',
  ASC: SliderOrderType = 'ASC';

@Injectable({ providedIn: 'root' })
export class NgImageSliderService {
  isBase64(str: string): boolean {
    const base64regex =
      /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
    return base64regex.test(str);
  }

  base64FileExtension(str: string): string {
    return str.substring('data:image/'.length, str.indexOf(';base64'));
  }

  orderArray<T extends { order?: number }>(
    arr: T[] = [],
    orderType: SliderOrderType = ASC
  ): T[] {
    if (arr?.length && orderType) {
      return arr.sort((ob1, ob2) => {
        if (ob1.order === null || !ob1.order) {
          return 1;
        } else if (ob2.order === null || !ob2.order) {
          return -1;
        } else if (ob1.order > ob2.order) {
          if (orderType === DESC) {
            return -1;
          } else {
            return 1;
          }
        } else if (ob1.order < ob2.order) {
          if (orderType === DESC) {
            return 1;
          } else {
            return -1;
          }
        }
        return 0;
      });
    }
    return arr;
  }

  /**
   * Verify if image exist
   * @input url: string: Image url
   * @returns boolean: true/false
   */
  async isImageExist(url: string): Promise<boolean> {
    if (!url) {
      return false;
    }
    return new Promise<boolean>((res) => {
      const image = new Image();
      image.onload = () => res(true);
      image.onerror = () => res(false);
      image.src = url;
    });
  }
}
