from pydantic import BaseModel

class UserCreate(BaseModel):
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserOut(BaseModel):
    id: int
    email: str

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    email: str | None = None
    password: str | None = None


class Token(BaseModel):
    access_token: str
    token_type: str