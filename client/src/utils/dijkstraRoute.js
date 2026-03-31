const EARTH_RADIUS_METERS = 6371000;

function toRadians(value) {
  return (value * Math.PI) / 180;
}

export function haversineDistance(pointA, pointB) {
  const [lat1, lng1] = pointA;
  const [lat2, lng2] = pointB;

  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const lat1Rad = toRadians(lat1);
  const lat2Rad = toRadians(lat2);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_METERS * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function interpolatePoint(bounds, rowIndex, colIndex, rows, cols) {
  const latStep = rows === 1 ? 0 : (bounds.maxLat - bounds.minLat) / (rows - 1);
  const lngStep = cols === 1 ? 0 : (bounds.maxLng - bounds.minLng) / (cols - 1);

  return [
    bounds.minLat + latStep * rowIndex,
    bounds.minLng + lngStep * colIndex,
  ];
}

function buildGrid(bounds, rows, cols) {
  const nodes = [];
  const adjacency = new Map();

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const id = `${row}-${col}`;
      const point = interpolatePoint(bounds, row, col, rows, cols);
      nodes.push({ id, point, row, col });
      adjacency.set(id, []);
    }
  }

  const directions = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ];

  const byId = new Map(nodes.map((node) => [node.id, node]));

  nodes.forEach((node) => {
    directions.forEach(([dRow, dCol]) => {
      const nextRow = node.row + dRow;
      const nextCol = node.col + dCol;
      if (nextRow < 0 || nextCol < 0 || nextRow >= rows || nextCol >= cols) {
        return;
      }

      const nextId = `${nextRow}-${nextCol}`;
      const nextNode = byId.get(nextId);
      adjacency.get(node.id).push({
        to: nextId,
        weight: haversineDistance(node.point, nextNode.point),
      });
    });
  });

  return { nodes, adjacency };
}

function findClosestNodeId(nodes, targetPoint) {
  let bestId = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  nodes.forEach((node) => {
    const distance = haversineDistance(node.point, targetPoint);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestId = node.id;
    }
  });

  return bestId;
}

function runDijkstra(adjacency, startId, endId) {
  const distances = new Map([[startId, 0]]);
  const previous = new Map();
  const queue = [{ id: startId, distance: 0 }];
  const visited = new Set();

  while (queue.length > 0) {
    queue.sort((a, b) => a.distance - b.distance);
    const current = queue.shift();

    if (!current || visited.has(current.id)) {
      continue;
    }

    visited.add(current.id);
    if (current.id === endId) {
      break;
    }

    const neighbors = adjacency.get(current.id) || [];
    neighbors.forEach((neighbor) => {
      const nextDistance = current.distance + neighbor.weight;
      const knownDistance = distances.get(neighbor.to) ?? Number.POSITIVE_INFINITY;

      if (nextDistance < knownDistance) {
        distances.set(neighbor.to, nextDistance);
        previous.set(neighbor.to, current.id);
        queue.push({ id: neighbor.to, distance: nextDistance });
      }
    });
  }

  if (!distances.has(endId)) {
    return null;
  }

  const path = [];
  let cursor = endId;

  while (cursor) {
    path.unshift(cursor);
    cursor = previous.get(cursor);
  }

  return {
    distance: distances.get(endId),
    path,
  };
}

function buildBounds(points, paddingFactor = 0.2) {
  const lats = points.map(([lat]) => lat);
  const lngs = points.map(([, lng]) => lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latPadding = Math.max((maxLat - minLat) * paddingFactor, 0.01);
  const lngPadding = Math.max((maxLng - minLng) * paddingFactor, 0.01);

  return {
    minLat: minLat - latPadding,
    maxLat: maxLat + latPadding,
    minLng: minLng - lngPadding,
    maxLng: maxLng + lngPadding,
  };
}

function pathIdsToCoordinates(pathIds, nodeById) {
  return pathIds.map((id) => nodeById.get(id)?.point).filter(Boolean);
}

export function createDijkstraRoute(stops, options = {}) {
  const validStops = stops.filter(Boolean);
  if (validStops.length < 2) {
    return null;
  }

  const rows = options.rows ?? 10;
  const cols = options.cols ?? 10;
  const bounds = buildBounds(validStops);
  const { nodes, adjacency } = buildGrid(bounds, rows, cols);
  const nodeById = new Map(nodes.map((node) => [node.id, node]));

  const routeCoordinates = [];
  let totalDistance = 0;

  for (let index = 0; index < validStops.length - 1; index += 1) {
    const startPoint = validStops[index];
    const endPoint = validStops[index + 1];
    const startId = findClosestNodeId(nodes, startPoint);
    const endId = findClosestNodeId(nodes, endPoint);
    const segment = runDijkstra(adjacency, startId, endId);

    if (!segment) {
      return null;
    }

    const segmentCoordinates = [
      startPoint,
      ...pathIdsToCoordinates(segment.path, nodeById),
      endPoint,
    ];

    if (routeCoordinates.length > 0) {
      segmentCoordinates.shift();
    }

    routeCoordinates.push(...segmentCoordinates);
    totalDistance += haversineDistance(startPoint, nodeById.get(startId).point);
    totalDistance += segment.distance;
    totalDistance += haversineDistance(nodeById.get(endId).point, endPoint);
  }

  return {
    coordinates: routeCoordinates,
    distanceMeters: totalDistance,
  };
}
