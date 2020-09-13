import { ReplaySubject, Subject } from 'rxjs';
import { IChild } from '../../IChild';
import { IComponent } from '../index';
import { DynamicEntry } from './DynamicEntry';

export interface IReplayDynamicEntry {
    update$: Subject<IChild>;
    result$: ReplaySubject<IComponent>;
    connect: () => void;
    destroy: () => void;
}

// NOTE: ReplaySubject is need because array updates is using combineLatest.
// Since some elements would update while others would be stale, we need to
// store DynamicEntry latest component to be reused when resubscribed
export const ReplayDynamicEntry = () => {
    const entry = DynamicEntry();
    const update$ = new Subject<IChild>();
    const result$ = new ReplaySubject<IComponent>(1);
    let connected = false;

    const connect = () => {
        if (connected) {
            return;
        }

        connected = true;
        entry.result$.subscribe(result$);
        update$.subscribe(entry.update$);
    };

    const destroy = () => {
        update$.complete();
        entry.destroy();
    };

    return {
        update$,
        result$,
        connect,
        destroy,
    };
};
