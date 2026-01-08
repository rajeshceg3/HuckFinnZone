
import IntelSystem from '../../js/intel.js';

describe('IntelSystem', () => {
    let intel;
    const mockNodeMap = {
        'node1': { id: 'node1', lat: 0, lng: 0, mile: 0 },
        'node2': { id: 'node2', lat: 10, lng: 10, mile: 100 },
        'node3': { id: 'node3', lat: 20, lng: 20, mile: 200 },
        'node4': { id: 'node4', lat: 30, lng: 30, mile: 200 }, // Zero length segment from node3
    };

    beforeEach(() => {
        intel = new IntelSystem(mockNodeMap);
    });

    test('initializes with default values', () => {
        expect(intel.currentPathIds).toEqual([]);
        expect(intel.data).toEqual([]);
        expect(intel.totalDistance).toBe(0);
    });

    describe('setPath', () => {
        test('sets path and calculates total distance', () => {
            const pathIds = ['node1', 'node2', 'node3'];
            intel.setPath(pathIds);

            expect(intel.currentPathIds).toEqual(pathIds);
            expect(intel.data.length).toBe(3);
            expect(intel.totalDistance).toBe(200);
            expect(intel.data[0].id).toBe('node1');
        });
    });

    describe('getDataAtProgress', () => {
        beforeEach(() => {
            intel.setPath(['node1', 'node2', 'node3']);
        });

        test('returns correct data at start (0.0)', () => {
            const result = intel.getDataAtProgress(0);
            expect(result.currentPoint.id).toBe('node1');
            expect(result.interpolated.lat).toBe(0);
            expect(result.interpolated.lng).toBe(0);
            expect(result.segmentProgress).toBe(0);
        });

        test('returns correct data at middle (0.5)', () => {
            // Total 200. Progress 0.5 -> Mile 100.
            // Should be exactly at node2.
            const result = intel.getDataAtProgress(0.5);
            // It finds segment node1-node2 first? No.
            // node1(0) - node2(100). target 100.
            // node2(100) - node3(200). target 100.
            // It iterates. i=0. 100 <= 100. Matches.
            // current node1, next node2. segmentDist 100.
            // segmentProgress = (100 - 0) / 100 = 1.

            expect(result.currentPoint.id).toBe('node1');
            expect(result.nextPoint.id).toBe('node2');
            expect(result.segmentProgress).toBe(1);
            expect(result.interpolated.lat).toBe(10);
        });

        test('returns correct data within segment (0.25)', () => {
            // Total 200. Progress 0.25 -> Mile 50.
            // Segment node1(0)-node2(100).
            // Segment progress = 0.5.
            // Lat = 0 + (10 - 0)*0.5 = 5.

            const result = intel.getDataAtProgress(0.25);
            expect(result.currentPoint.id).toBe('node1');
            expect(result.nextPoint.id).toBe('node2');
            expect(result.segmentProgress).toBe(0.5);
            expect(result.interpolated.lat).toBe(5);
        });

        test('handles end of path (1.0)', () => {
             const result = intel.getDataAtProgress(1.0);
             expect(result.currentPoint.id).toBe('node3');
             expect(result.segmentProgress).toBe(1);
             expect(result.interpolated.lat).toBe(20);
        });

        test('handles zero-length segments', () => {
             intel.setPath(['node3', 'node4']); // 200 -> 200
             // Total dist 200? Wait, logic uses data[last].mile.
             // If setPath(['node3', 'node4']), totalDistance is 200.
             // Progress 0.5 -> 100.
             // node3(200). 100 is not >= 200.
             // Loop doesn't find it.
             // Fallback logic?
             // Actually if progress * totalDistance < start, it might fail?

             // Wait, setPath sets totalDistance to last mile.
             // If we only have node3(200) and node4(200), totalDistance is 200.
             // If we ask for progress 0.5, target is 100.
             // No segment covers 100.
             // It returns initial values (node3, node4)?
             // Let's check constructor/init values.
             // Loop logic: for i..
             // if targetMile >= data[i].mile && targetMile <= data[i+1].mile

             // If path is node3(200), node4(200).
             // target 100.
             // i=0. 200 <= 200.
             // But target 100 is NOT >= 200.
             // Loop finishes.
             // Returns currentPoint = data[0] (node3), nextPoint = data[1] (node4).
             // segmentProgress = 0 (default).
             // Interp lat = 20 + (30-20)*0 = 20.

             // Correct behavior for "before start" technically.

             // Let's test a valid progress for this path.
             // If path starts at mile 200, progress 0 -> mile 0.
             // This assumes path ALWAYS starts at mile 0?
             // The logic `targetMile = progress * this.totalDistance` implies 0 to Max.
             // But if `node1` is mile 0, `node3` is mile 200.
             // If we switch path to start at node3...
             // Real app scenario: Paths branch off.
             // Maybe `setPath` assumes full journey context.

             // Let's test the specific zero-div case.
             // node3(200) -> node4(200).
             // If we are AT mile 200.

             // Let's use the full path including the zero segment.
             intel.setPath(['node1', 'node2', 'node3', 'node4']);
             // total 200.
             // progress 1.0 -> 200.

             // i=2. node3(200), node4(200).
             // target 200. 200 >= 200 && 200 <= 200. Match.
             // segmentDist = 0.
             // segmentProgress = 1.

             const result = intel.getDataAtProgress(1.0);
             // Logic handles progress >= 1 block separately.
             // Let's try progress 0.99999 -> 199.999.
             // i=1 (node2-node3) covers 100-200.

             // We need to hit exactly the segment i=2.
             // Only if target is exactly 200.

             // But wait, if progress=1, the block `if (progress >= 1)` executes.

             // Let's try forcing it via manual call or carefully crafted path.
             // nodeA(0) -> nodeB(0).
             intel.setPath(['node1', 'node1']);
             // total 0.
             // progress 0.5 -> 0.
             // i=0. 0>=0 && 0<=0. Match.
             // segmentDist 0.
             // segmentProgress should be 1.

             const result2 = intel.getDataAtProgress(0.5);
             expect(result2.segmentProgress).toBe(1);
        });
    });
});
