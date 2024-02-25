// sanity.config.js
import { defineConfig } from "sanity";
import { structureTool } from 'sanity/structure'
import {codeInput} from '@sanity/code-input'
import schemas from './schemas/schema'

export default defineConfig({
  title: "andreas.jilvero.se",
  projectId: "oppc4ia1",
  dataset: "production",
  plugins: [structureTool(), codeInput()],
  schema: {
    types: schemas,
  },
});