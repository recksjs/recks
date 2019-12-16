import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { IFnComponent } from '../Component/Fn';
import { ICompiledComponent, renderComponent } from '.';

// watch dyn root comp
//    on update -- render component( target = target )
export function renderFn(component: IFnComponent): Observable<ICompiledComponent> {
    return component.result$.pipe(
        switchMap(result => renderComponent(result))
    );
}
