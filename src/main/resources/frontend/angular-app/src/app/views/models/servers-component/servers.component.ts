import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Server} from '../../../entity/Server';
import {GlobalConstants} from '../../../constants/global-constants';
import {AuthService} from "../../../services/AuthService";
import {faCogs, faSignInAlt, faTrashAlt} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-servers',
  templateUrl: './servers.component.html'
})
export class ServersComponent implements OnInit {
  proceedIcon = faSignInAlt;
  settingIcon = faCogs;
  deleteIcon = faTrashAlt;


  localApi: string = GlobalConstants.apiUrl + 'api/server'

  insertForm: FormGroup;
  updateForm: FormGroup;

  errorMessage: string;
  confirmMessage: string;
  inputError: string;

  servers: Server[] = [];

  protocols = [
    'SSH', 'FTP'
  ];

  testResult: string;

  constructor(private authService: AuthService,
              private router: Router,
              private http: HttpClient,
              private fb: FormBuilder,) {

    this.insertForm = this.fb.group({
      name: ['', Validators.required],
      ip: ['', Validators.required],
      port: ['', Validators.required],
      login: ['', Validators.required],
      password: ['', Validators.required],
      protocol: ['', Validators.required]
    });

    this.updateForm = this.fb.group({
      name: ['', Validators.required],
      port: ['', Validators.required],
      login: ['', Validators.required],
      password: ['', Validators.required],
      protocol: ['', Validators.required],
      enabled: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.servers.push(new Server())
    this.http.get<Server[]>(this.localApi + '/').subscribe(result => {
      this.servers = result;
    }, error => {
      this.errorMessage = "Cant get list of servers";
    });
  }


  routeToDirectories(server: Server): void {
    const objectId = server.objectId;
    this.updateServer(server);
    this.router.navigateByUrl('/directories', {state: {objectId}});
  }

  deleteServer(objectId: number): void {
    this.http.delete(this.localApi + "/delete/" + objectId).subscribe(result => {
      this.confirmMessage = "Server deleted successful";
    }, error => {
      this.errorMessage = "Error with deleting server";
    })
  }

  testConnection(): void {
    this.http.post<boolean>(this.localApi + '/testConnection', this.insertForm.value).subscribe(result => {
      this.testResult = result ? "Connection established" : "Cant connect";
    }, error => {
      this.testResult = "Error with checking connection";
    })
  }

  addServer(): void {
    const server = this.insertForm.value;

    if (!this.insertForm.valid) {
      this.inputError = "Form not valid";
      return;
    }
    this.http.post(this.localApi + "/add", server).subscribe(result => {
      this.confirmMessage = "Server added";
      server['objectId'] = result;
      this.servers.push(server);
      this.insertForm.reset({});
    }, error => {
      this.inputError = "Cant add server";
    })
  }

  showSettings(server: Server): void {
    this.updateForm.controls.name.setValue(server.name);
    this.updateForm.controls.port.setValue(server.port);
    this.updateForm.controls.login.setValue(server.login);
    this.updateForm.controls.password.setValue(server.password);
    this.updateForm.controls.protocol.setValue(server.protocol);
    this.updateForm.controls.enabled.setValue(server.enabled);
  }

  updateServerByForm(): void {
    const server = this.updateForm.value;

    this.http.put(this.localApi + "/update", server).subscribe(result => {
      this.confirmMessage = "Server updated";

      let changedServer = this.servers.find(this.findIndexToUpdate);
      let index = this.servers.indexOf(changedServer);

      this.servers.splice(index, 1, server);

    }, error => {
      alert("Cant update server");
    })
  }

  updateServer(server: Server) {
    server.lastAccessByUser = new Date();
    this.http.put(this.localApi + "/update", server).subscribe(result => {
    }, error => {
    })
  }

  private findIndexToUpdate(newItem) {
    return newItem.id === this;
  }

}
