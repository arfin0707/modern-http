import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { compress } from "hono/compress";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { getSingleNoteSchema  } from "./schema";
import { updateNoteRequestSchema  } from "./schema";
import { createNoteRequestSchema  } from "./schema";
import { getPaginatedNoteSchema  } from "./schema";




import {
  Note,
  createNote,
  deleteNote,
  getNote,
  updateNote,
  getPaginated,
  getNoteByText
} from "./notes";

const app = new Hono();

app.use("*", secureHeaders());

app.use("*", compress());

app.use(
  "*",
  cors({
    origin: ["https://seen.red"],
  })
);


//CREATE
app.post("/", async (c) => {
 
  const data = await c.req.json();
  const validation = createNoteRequestSchema.safeParse(data);

if(!validation.success){
  c.status(400)
  return c.json({
    success:false,
    message:JSON.parse(validation.error.message)[0]
  })
}

  const note =await getNoteByText(validation.data.text);

  if (note) {
    c.status(400)
    return c.json({ message: "already exists" });
  }

  const newNote: Partial<Note> = {
    text: data.text,
    date: new Date(data.date),
  };

  const dbNote = await createNote(newNote);
  console.log({dbNote});

  return c.json({ message: "successfully added the note", note: dbNote });
});

//READ
app.get("/:id", async (c) => {


  const result= getSingleNoteSchema.safeParse(c.req.param("id"));

  if(!result.success){
    c.status(400);
    return c.json({
      success:false, message: JSON.parse(result.error.message)[0].message
    });

  }

  const id= result.data
  let note: Note | undefined;
  let success= true;
  let message= "A note found";
    try{
      note = await getNote(id);
    }catch(error){
      c.status(500);
      success= false;
      message = "Error retriving notes"
      console.log("Error connecting DB",error)
      return c.json({success, message});

    }


  if (!note) {
    c.status(404);
    return c.json({ success:false, message: "note not found" });
  }

  return c.json({success, message, note});
});


//UPDATE
app.put("/:id", async (c) => {
  const result= getSingleNoteSchema.safeParse(c.req.param("id"));

  let data:unknown;
  try{
    data = await c.req.json();


  }catch(error){
    console.log(error);
    c.status(400);
    return c.json({success:false, message: "Invalid json in the request body "});


  }
  
  if(!result.success){
    c.status(400);
    return c.json({success:false, message: JSON.parse(result.error.message)[0].message});
  }

  const id =result.data;
  const validation= updateNoteRequestSchema.safeParse(data);
  if(!validation.success){
    c.status(400);
    return c.json({success:false, message: JSON.parse(validation.error.message)[0]});

  }

  const validatedData=validation.data;

  let success= true;
  let message = "successfully retrived"
  let note:Note | undefined;
  
  try{
    const found = await getNote(result.data);

    if (!found) {
      c.status(404);
      return c.json({ message: "note not found" });
    }  
    note=found;
  }catch(error){
    c.status(500);
    success= false;
    message = "Error retriving notes"
    console.log("Error connecting DB",error)
    return c.json({success, message})

  }
  


  // const foundIndex = notes.findIndex((n) => n.id === id);

  // if (foundIndex === -1) {
  //   c.status(404);
  //   return c.json({success:false, message: "note not found" });
  // }





  note = {
    id:note.id,
    text: validatedData.text || note.text,
    date: new Date(validatedData.date || note.date.getTime()),
  };


  try{

    await updateNote(note.id, note);


  }catch(error){
    c.status(500);
    console.error("Error Updating DB",error)
    return c.json({success:false, message:"Error Updating the note"})

  }

  return c.json({ success:true, message: "successfully updated" });
});


// DELETE
  app.delete("/:id", async (c) => {
    const id=c.req.param("id");
  const result= getSingleNoteSchema.safeParse(id);
  if(!result.success){
    c.status(400);
    return c.json({message: JSON.parse(result.error.message)[0].message});
  }



  const found = await getNote(result.data);

  if (!found) {
    c.status(404);
    return c.json({ message: "note not found" });
  }

  deleteNote(parseInt(id));
  return c.json({ success:true, message: "successfully deleted" });
});

// LIST
app.get("/", async (c) => {
let success= true;
let message = "successfully retrived"
let notes:Note[];

const limit =parseInt(c.req.query("limit") || "10")
const page =parseInt(c.req.query("page") || "0")
const id =parseInt(c.req.query("id") || "0")


const result = getPaginatedNoteSchema.safeParse({limit,page,id});

if(!result.success){
  c.status(400);
  return c.json({message: JSON.parse(result.error.message)[0].message});
}


try{
  notes = await getPaginated(
    result.data as (Parameters<typeof getPaginated>[0] ));
}catch(error){
  c.status(500);
  success= false;
  message = "Error retriving notes"
  console.log("Error connecting DB",error)
  notes=[]
}

return c.json({success, message, notes})

}); 

serve(app);
