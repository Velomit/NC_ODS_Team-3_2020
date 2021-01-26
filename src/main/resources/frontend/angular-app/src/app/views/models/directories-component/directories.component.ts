import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {HttpClient, HttpParams} from '@angular/common/http';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {GlobalConstants} from '../../../constants/global-constants';
import {Directory} from '../../../entity/Directory';
import {AuthService} from "../../../services/AuthService";
import {LogFile} from "../../../entity/LogFile";
import {DirectoryPage} from "../../../pageable/DirectoryPage";


@Component({
  selector: 'app-directories',
  templateUrl: './directories.component.html'
})
export class DirectoriesComponent implements OnInit {

  insertForm: FormGroup;
  searchForm: FormGroup;

  directories: Directory[] = [];

  dir:Directory;
  currentDir: Directory;

  files: LogFile[] = [];
  filesFromDir: LogFile[] = [];
  addingFiles: LogFile[];

  directoryPage: DirectoryPage;

  serverId: bigint;
  testResult: string;
  getResult: string;
  msg: string;

  constructor(private authService: AuthService,
              private router: Router,
              private http: HttpClient,
              private fb: FormBuilder) {

    this.insertForm = this.fb.group({
      path: ['', Validators.required]
    });
    this.searchForm = this.fb.group({
      searchText: ['', Validators.required]
    });
    if(this.router.getCurrentNavigation().extras.state === undefined){
      this.router.navigateByUrl('/servers');
    }else{
      this.serverId = this.router.getCurrentNavigation().extras.state['objectId'];
    }
  }

  getDirectoriesFromPage(pageNumber: number): void {

    let params = new HttpParams()
      .set("parentId", this.serverId.toString())
      .set("page", pageNumber.toString());

    this.http.get<DirectoryPage>(GlobalConstants.apiUrl + 'api/directory/', {params}).subscribe(result => {
      console.log(result);
      this.directoryPage = result;
      this.directoryPage.number = this.directoryPage.number + 1;// In Spring pages start from 0.
      console.log(this.directoryPage);
    });
  }

  ngOnInit(): void {
    this.getDirectoriesFromPage(1);
  }


  routeToLogs(objectId: bigint): void {
    this.router.navigateByUrl('/logs', {state: {objectId}});
  }

  deleteDirectory(objectId: bigint): void {
    this.http.delete(GlobalConstants.apiUrl + 'api/directory/delete/' + objectId).subscribe(() => {
      //this.directories = this.directories.filter(item => item.objectId !== objectId);
      //this.directoryPage.content = this.directoryPage.content.filter(item => item.objectId !== objectId);
      let deletedDirectory = this.directoryPage.content.find(deletedElement => deletedElement.objectId == objectId);
      let index = this.directoryPage.content.indexOf(deletedDirectory);
      this.directoryPage.content.splice(index, 1);
    });
  }

  addDirectory(): void {
    if(this.dir === undefined) this.testDirectory()
    console.log(this.insertForm.value);
    this.http.post<Directory>(GlobalConstants.apiUrl + 'api/directory/add', this.dir).subscribe(result => {
      this.currentDir = result;
      this.dir = undefined
      this.insertForm.reset({});
      this.msg = 'Directory added';
      console.log('Add Directory ', result);
      this.addFilesToDb()
    }, error=>{
        this.msg = 'Something went wrong with directory';
    });
  }

  addFilesToDb():void{
    if(this.files === undefined) {
      this.getFiles()
    }
    this.addFiles(this.currentDir, this.files)
  }

  testDirectory(): void{
    this.dir = new Directory();
    this.dir.parentId = this.serverId;
    this.dir.path = this.insertForm.value.path

    this.http.post<boolean>(GlobalConstants.apiUrl + 'api/directory/test', this.dir).subscribe(result => {
      this.testResult = result ? "Connection established" : "Cant connect";
    }, error => {
      this.testResult = "Error with checking connection";
    })
  }

  getFiles():void{
    if(this.dir === undefined) this.testDirectory()
    this.http.post<LogFile[]>(GlobalConstants.apiUrl + 'api/directory/files', this.dir).subscribe(result => {
      result.forEach(result => result.checked = true)
      this.filesFromDir = this.files = result;
    }, error => {
      this.getResult = 'Error with receiving files';
    })
  }

  addFiles(dir: Directory, files:LogFile[]):void{
    files.forEach(result => result.parentId = dir.objectId);
    this.addingFiles = [];
    files.forEach(result => {if(result.checked) this.addingFiles.push(result)})
    if(this.addingFiles == []){
      console.log('AddingFiles is empty');
    } else{
      this.http.post<LogFile[]>(GlobalConstants.apiUrl + 'api/directory/files/add', this.addingFiles).subscribe(result => {
        console.log('Complete',this.addingFiles);
        this.addingFiles = undefined
        this.files = undefined
        this.ngOnInit()
      }, error => {
        this.msg = 'Something went wrong with files';
      });
    }
  }

  changeStatusFile(name:String){
    this.files.find(f => f.name == name).checked = !this.files.find(f => f.name == name).checked;
  }

  closeDir():void{
    this.dir = undefined
    this.addingFiles = undefined
    this.files = undefined
    this.insertForm.reset();
    this.searchForm.reset()
  }

  search():void{
    const val = this.searchForm.value
    if(val.searchText){
      this.files = []
      this.filesFromDir.forEach(result => {
        if(result.fileName.includes(val.searchText)){
          this.files.push(result)
        }
      })
    }
  }
}