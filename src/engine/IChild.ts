import { Observable } from 'rxjs';
import { IElement } from './Element';

export type IChild
    = null
    | number
    | string
    | IElement<any>
    | Array<IElement<any>>
    | Observable<any>
    ;
