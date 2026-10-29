const [major, minor, patch] = process.versions.node.split('.').map(Number);

const minimumByMajor = new Map([
  [22, [23, 4]],
  [24, [22, 1]],
  [26, [13, 0]]
]);

const minimum = minimumByMajor.get(major);
const meetsMinimum = minimum && (minor > minimum[0] || (minor === minimum[0] && patch >= minimum[1]));

if (!meetsMinimum) {
  console.error(
    `Node ${process.versions.node} no es un runtime admitido. ` +
      'Usa Node 22.23.4+, 24.22.1+ o 26.13.0+ dentro de su línea mayor; ' +
      'el repositorio fija 24.22.2 en .node-version.'
  );
  process.exitCode = 1;
} else {
  console.log(`Node ${process.versions.node}: baseline de seguridad admitido.`);
}
