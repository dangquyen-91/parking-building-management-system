import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import YAML from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));

const swaggerSpec = YAML.parse(
  readFileSync(join(__dirname, '../../swagger.yaml'), 'utf8')
);

export default swaggerSpec;
