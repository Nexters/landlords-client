import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CheckItem, CHECKLIST_STATUS, Question } from 'entity/checklist';
import { ConvertedRoom, Room } from 'entity/rooms';
import { RootState } from 'store';
import { filterQuestionsByStatus, setChecksByAnswers } from 'utils/checklist';
import { convertRoomForDisplay, createRoomMap } from 'utils/room';

interface RoomsState {
  rooms: ConvertedRoom[];
  checklistStatus: string;
  roomMap: { [id: string]: ConvertedRoom };
  singleCheckQuestions: Question[];
  multiCheckQuestions: Question[];
  answers: CheckItem[];
}

const initialState = {
  rooms: [] as ConvertedRoom[],
  checklistStatus: CHECKLIST_STATUS.Looking,
  roomMap: {} as { [id: string]: ConvertedRoom },
  singleCheckQuestions: [] as Question[],
  multiCheckQuestions: [] as Question[],
  answers: [] as CheckItem[],
};

const reducers = {
  setRooms: (state: RoomsState, { payload }: PayloadAction<Room[]>) => {
    state.rooms = payload.map((room) => convertRoomForDisplay(room));
    state.roomMap = createRoomMap(state.rooms);
  },
  setChecklistStatus: (state: RoomsState, { payload }: PayloadAction<string>) => {
    state.checklistStatus = payload;
  },
  setQuestions: (state: RoomsState, { payload }: PayloadAction<Question[]>) => {
    const QuestionsByState = filterQuestionsByStatus(payload, state.checklistStatus);
    state.singleCheckQuestions = QuestionsByState.filter(({ type_ }) => type_ === 'SingleChoice');
    state.multiCheckQuestions = QuestionsByState.filter(({ type_ }) => type_ === 'MultipleChoice');
  },
  setAnswers: (state: RoomsState, { payload }: PayloadAction<CheckItem[]>) => {
    state.answers = payload;
  },
  checkQuestions: (state: RoomsState) => {
    const { singleCheckQuestions, multiCheckQuestions, answers } = state;
    state.singleCheckQuestions = setChecksByAnswers(singleCheckQuestions, answers);
    state.multiCheckQuestions = setChecksByAnswers(multiCheckQuestions, answers);
  },
  addAnswer: (state: RoomsState, { payload }: PayloadAction<CheckItem>) => {
    state.answers.push(payload);
    reducers.checkQuestions(state);
  },
  removeAnswer: (state: RoomsState, { payload }: PayloadAction<CheckItem>) => {
    state.answers = state.answers.filter(({ uid }) => uid !== payload.uid);
    reducers.checkQuestions(state);
  },
  removeRoom: (state: RoomsState, { payload }: PayloadAction<ConvertedRoom>) => {
    state.rooms = state.rooms.filter(({ uid }) => uid !== payload.uid);
    delete state.roomMap[payload.uid];
  },
};

const slice = createSlice({
  name: 'ROOMS',
  initialState,
  reducers,
});

export const roomsSelector = createSelector(
  (state: RootState) => state[ROOMS],
  (rooms) => rooms,
);

export const ROOMS = slice.name;
export const roomsReducer = slice.reducer;
export const roomsAction = slice.actions;
