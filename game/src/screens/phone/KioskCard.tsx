import { Modal } from '../../components/Modal';
import { AppView, type AppHostProps, type AppId } from './apps';

interface Props extends AppHostProps {
  app: AppId;
  title: string;
  icon: string;
}

/** In-world service counter (Job Center, Bank…): the same app content, no phone required. */
export function KioskCard({ app, title, icon, ...host }: Props) {
  return (
    <Modal onClose={host.onClose} className="ksk-card">
      <div className="ksk-head">
        <span className="ksk-icon">{icon}</span>
        <b>{title}</b>
      </div>
      <div className="ksk-body">
        <AppView id={app} host={host} />
      </div>
    </Modal>
  );
}
