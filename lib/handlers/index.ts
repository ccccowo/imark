import { AIActionHandler } from './types';
import { createClassHandler } from './class/createClass';
import { deleteClassHandler } from './class/deleteClass';

const handlers: AIActionHandler[] = [
    createClassHandler,
    deleteClassHandler
];

export const getHandler = (action: string) => {
    return handlers.find(h => h.action === action);
}; 