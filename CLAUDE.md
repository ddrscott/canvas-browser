# Canvas Browser - Development Guidelines

## Commands
- `npm start` - Start the application (electron-forge)
- `npm run package` - Package the app for distribution
- `npm run make` - Build distributable packages
- `npm run lint` - Run ESLint checks

## Code Style
- **TypeScript**: Use explicit types, avoid `any` (use specific interfaces/types)
- **Components**: React functional components with hooks, explicit prop interfaces
- **Imports**: Group React imports first, then libraries, then local imports
- **Error Handling**: Use try/catch with specific error types, detailed error messages
- **Logging**: Use console.log for development, with descriptive context prefixes
- **Naming**: 
  - PascalCase for components, interfaces, and types
  - camelCase for variables, functions, and methods
  - UPPER_CASE for constants

## Project Structure
- `/src/components` - Reusable UI components
- `/src/shapes` - TLDraw shape implementations
- `/src/utils` - Utility functions and helpers
- `/src/types` - TypeScript type definitions