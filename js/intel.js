/**
 * Manages the data and calculates interpolations
 */
export default class IntelSystem {
    constructor(nodeMap) {
        this.nodeMap = nodeMap;
        this.currentPathIds = [];
        this.data = [];
        this.totalDistance = 0;
    }

    setPath(pathIds) {
        this.currentPathIds = pathIds;
        // Rebuild linear data array from IDs
        this.data = pathIds.map(id => this.nodeMap[id]);

        // Recalculate total distance based on the new path
        // Note: The miles in data.js are absolute for historical path.
        // For alternate paths, we might need to adjust logic if miles aren't sequential/consistent.
        // For this prototype, we assume miles are somewhat consistent or we just use the last point's mile.
        this.totalDistance = this.data[this.data.length - 1].mile;
    }

    getPoints() {
        return this.data;
    }

    // Get the active segment based on progress (0.0 to 1.0)
    getDataAtProgress(progress) {
        const targetMile = progress * this.totalDistance;

        // Find the segment we are in
        let currentPoint = this.data[0];
        let nextPoint = this.data[1];
        let index = 0;
        let segmentProgress = 0;

        for (let i = 0; i < this.data.length - 1; i++) {
            if (targetMile >= this.data[i].mile && targetMile <= this.data[i+1].mile) {
                currentPoint = this.data[i];
                nextPoint = this.data[i+1];
                index = i;

                // Calculate progress within this segment (0.0 to 1.0)
                const segmentDist = this.data[i+1].mile - this.data[i].mile;
                if (segmentDist > 0) {
                    segmentProgress = (targetMile - this.data[i].mile) / segmentDist;
                }
                break;
            }
        }

        // If we are past the last point
        if (progress >= 1) {
            currentPoint = this.data[this.data.length - 1];
            nextPoint = currentPoint;
            index = this.data.length - 1;
            segmentProgress = 1;
        }

        // Interpolate Lat/Lng
        const lat = currentPoint.lat + (nextPoint.lat - currentPoint.lat) * segmentProgress;
        const lng = currentPoint.lng + (nextPoint.lng - currentPoint.lng) * segmentProgress;

        return { currentPoint, nextPoint, index, targetMile, interpolated: { lat, lng } };
    }
}
