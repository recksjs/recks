import { switchMap } from 'rxjs/operators';
import { IObservableComponent } from '../Component/Observable';
import { renderComponent } from '.';

// watch dyn root comp
//    on update -- render component( target = target )
export function renderObservable(component: IObservableComponent){
    return component.result$.pipe(
        switchMap(result => renderComponent(result))
    )
}
