import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useSelector } from 'react-redux'
import toastReducers from '../components/Toast/toastSlice';
import application from './application/reducer'
import swap from "./swap/reducer"
import blockReducer from "./block"
const store = configureStore({
    reducer: {
        toast: toastReducers,
        block: blockReducer,
        application,

        // Exchange
        swap
    },
});

export default store

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
