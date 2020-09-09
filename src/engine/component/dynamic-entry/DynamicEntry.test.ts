import { DynamicEntry } from './DynamicEntry';

describe('DynamicEntry', () => {
    test('Destroy', () => {
        const dynamicEntry = DynamicEntry();
        const mockObserver = {
            complete: jest.fn(),
        };
        dynamicEntry.result$.subscribe(mockObserver);
        dynamicEntry.destroy();

        expect(mockObserver.complete.mock.calls.length).toBe(1);
    });
});
