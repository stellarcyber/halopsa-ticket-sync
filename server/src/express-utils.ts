import express, {
  Handler,
  NextFunction,
  Request,
  Response
} from 'express';

export const getRouterInstance = () => express.Router();
