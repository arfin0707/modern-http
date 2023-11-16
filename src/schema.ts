import {z} from "zod";
import { notesSchema } from "./notes";

export const getPaginatedNoteSchema =z.object({
    limit:z.number().int().min(1).max(500).optional().default(10),
    page:z.number().int().optional(),
    id:z.number().int().optional()

    

})



export const getSingleNoteSchema = z
.string()
.max(15)
.transform((noteIdString) => parseInt(noteIdString))
.refine((noteId)=>noteId>0, {
    message: "note id must be greater than 0"
});

export const updateNoteRequestSchema =z. object({
    text: z.string().min(5).max(5000).optional(),
    date: z.number().int().min(Date.now()).optional(),
});


export const createNoteRequestSchema =z. object({
    text: z.string().min(5).max(5000),
    date: z.number().int().min(Date.now()).optional(),
});
export const notes = notesSchema;

