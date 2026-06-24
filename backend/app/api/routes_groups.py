from fastapi import APIRouter, HTTPException

from app.models.schemas import Group, GroupCreate, GroupUpdate
from app.services import groups_repo
from app.services.groups_repo import CannotDeleteDefaultGroup, GroupNameTaken, GroupNotFound

router = APIRouter()


@router.get("/api/groups", response_model=list[Group])
def get_groups() -> list[Group]:
    return groups_repo.list_groups()


@router.post("/api/groups", response_model=Group, status_code=201)
def create_group(payload: GroupCreate) -> Group:
    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Group name cannot be empty")
    try:
        return groups_repo.create_group(name)
    except GroupNameTaken:
        raise HTTPException(status_code=409, detail=f'A group named "{name}" already exists')


@router.patch("/api/groups/{group_id}", response_model=Group)
def rename_group(group_id: str, payload: GroupUpdate) -> Group:
    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Group name cannot be empty")
    try:
        return groups_repo.rename_group(group_id, name)
    except GroupNotFound:
        raise HTTPException(status_code=404, detail="Group not found")
    except GroupNameTaken:
        raise HTTPException(status_code=409, detail=f'A group named "{name}" already exists')


@router.delete("/api/groups/{group_id}", status_code=204)
def delete_group(group_id: str) -> None:
    try:
        groups_repo.delete_group(group_id)
    except GroupNotFound:
        raise HTTPException(status_code=404, detail="Group not found")
    except CannotDeleteDefaultGroup:
        raise HTTPException(status_code=400, detail="The default group cannot be deleted")
